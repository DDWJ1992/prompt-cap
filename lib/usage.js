/**
 * Read Claude Code statusline rate_limits → prompt-cap state.usage.
 *
 * Official: rate_limits only arrives on statusLine stdin (not PreToolUse).
 * Fields (Pro/Max after first API response):
 *   rate_limits.five_hour.used_percentage / resets_at
 *   rate_limits.seven_day.used_percentage / resets_at
 *
 * Mapping (honest, documented in README):
 *   promptPercent  ← five_hour  (短窗口 / 5h)
 *   weeklyPercent  ← seven_day  (周窗口 / 7d)
 *   dailyPercent   ← null       (Claude 无独立日窗口；配置键保留供自测)
 */
import fs from 'node:fs';
import { STATE_PATH, DATA_DIR } from './paths.js';
import { loadState, saveState, defaultState } from './store.js';

/** Ignore snapshots older than this many seconds (fail-open). */
export const STALE_AFTER_SEC = 900;

/**
 * @param {any} payload statusline JSON
 * @returns {{
 *   usage: { promptPercent: number|null, dailyPercent: number|null, weeklyPercent: number|null },
 *   resetsAt: { fiveHour: number|null, sevenDay: number|null },
 *   capturedAt: number,
 *   hasRateLimits: boolean,
 *   contextPercent: number|null
 * }}
 */
export function parseStatuslinePayload(payload) {
  const rl = payload?.rate_limits ?? null;
  const five = rl?.five_hour ?? null;
  const seven = rl?.seven_day ?? null;

  const toPct = (v) => {
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const toEpoch = (v) => {
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.floor(n) : null;
  };

  const promptPercent = toPct(five?.used_percentage);
  const weeklyPercent = toPct(seven?.used_percentage);
  const contextPercent = toPct(payload?.context_window?.used_percentage);

  return {
    usage: {
      promptPercent,
      dailyPercent: null,
      weeklyPercent,
    },
    resetsAt: {
      fiveHour: toEpoch(five?.resets_at),
      sevenDay: toEpoch(seven?.resets_at),
    },
    capturedAt: Math.floor(Date.now() / 1000),
    hasRateLimits: Boolean(rl && (promptPercent != null || weeklyPercent != null)),
    contextPercent,
  };
}

/**
 * Apply a parsed snapshot into state.json (atomic write via saveState).
 * Only overwrites usage when the payload actually carried rate_limits numbers;
 * empty/missing rate_limits does NOT clobber a good prior snapshot.
 */
export function applyUsageSnapshot(parsed, { force = false } = {}) {
  const state = loadState();
  state.lastCheckedAt = new Date().toISOString();
  state.capturedAt = parsed.capturedAt;
  state.resetsAt = parsed.resetsAt;
  state.contextPercent = parsed.contextPercent ?? null;

  if (parsed.hasRateLimits || force) {
    state.usage = {
      promptPercent: parsed.usage.promptPercent,
      dailyPercent: parsed.usage.dailyPercent,
      weeklyPercent: parsed.usage.weeklyPercent,
    };
  }

  saveState(state);
  return state;
}

/** Write statusline stdin JSON into state (best-effort). */
export function captureFromStatuslineJson(payload) {
  const parsed = parseStatuslinePayload(payload);
  return applyUsageSnapshot(parsed);
}

/**
 * @param {object} state
 * @param {Date|number} [now]
 * @returns {{ stale: boolean, reason: string|null }}
 */
export function usageFreshness(state, now = new Date()) {
  const nowSec = now instanceof Date ? Math.floor(now.getTime() / 1000) : Math.floor(Number(now));
  const captured = state.capturedAt != null ? Number(state.capturedAt) : null;

  if (captured == null || !Number.isFinite(captured)) {
    return { stale: true, reason: '尚无用量快照（statusline 未捕获）' };
  }
  if (nowSec - captured > STALE_AFTER_SEC) {
    return {
      stale: true,
      reason: `用量快照已过期（${nowSec - captured}s > ${STALE_AFTER_SEC}s）`,
    };
  }

  const fiveReset = state.resetsAt?.fiveHour;
  if (fiveReset != null && Number.isFinite(fiveReset) && nowSec >= fiveReset) {
    return { stale: true, reason: '5h 窗口已重置，等待新快照' };
  }

  const u = state.usage || {};
  if (u.promptPercent == null && u.dailyPercent == null && u.weeklyPercent == null) {
    return { stale: true, reason: '快照中无有效用量百分比' };
  }

  return { stale: false, reason: null };
}

/** Inject fake usage for self-test (does not need Claude Code). */
export function injectUsage({
  promptPercent = null,
  dailyPercent = null,
  weeklyPercent = null,
  capturedAt = Math.floor(Date.now() / 1000),
  fiveHourResetsAt = null,
  sevenDayResetsAt = null,
} = {}) {
  const state = loadState();
  state.usage = { promptPercent, dailyPercent, weeklyPercent };
  state.capturedAt = capturedAt;
  state.resetsAt = {
    fiveHour: fiveHourResetsAt,
    sevenDay: sevenDayResetsAt,
  };
  state.lastCheckedAt = new Date().toISOString();
  saveState(state);
  return state;
}

export function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export { STATE_PATH, defaultState };
