/**
 * Hard-stop decision: compare usage vs configured lines.
 *
 * Fail-open when:
 *   - enforcement off
 *   - resume window active
 *   - no / stale usage snapshot
 *
 * Deny when any evaluated line crosses its limit.
 */
import { usageFreshness } from './usage.js';

/**
 * @param {{ limits: { promptPercent: number, dailyPercent: number, weeklyPercent: number }, enforced: boolean, resumeUntil: string|null }} config
 * @param {{ usage: { promptPercent: number|null, dailyPercent: number|null, weeklyPercent: number|null }, capturedAt?: number|null, resetsAt?: object }} state
 * @param {Date} [now]
 * @returns {{ allow: boolean, reason: string|null, crossed: string[], failOpen: boolean }}
 */
export function decide(config, state, now = new Date()) {
  if (!config.enforced) {
    return { allow: true, reason: 'enforcement 已关闭', crossed: [], failOpen: false };
  }

  if (config.resumeUntil) {
    const until = new Date(config.resumeUntil);
    if (!Number.isNaN(until.getTime()) && now < until) {
      return {
        allow: true,
        reason: `临时放行至 ${config.resumeUntil}`,
        crossed: [],
        failOpen: false,
      };
    }
  }

  const freshness = usageFreshness(state, now);
  if (freshness.stale) {
    return {
      allow: true,
      reason: `fail-open：${freshness.reason}`,
      crossed: [],
      failOpen: true,
    };
  }

  const { limits } = config;
  const usage = state.usage || {};
  const crossed = [];

  if (usage.promptPercent != null && usage.promptPercent >= limits.promptPercent) {
    crossed.push(
      `短窗口(5h) ${fmt(usage.promptPercent)}% ≥ 红线 ${limits.promptPercent}%`,
    );
  }
  if (usage.dailyPercent != null && usage.dailyPercent >= limits.dailyPercent) {
    crossed.push(
      `日用量 ${fmt(usage.dailyPercent)}% ≥ 红线 ${limits.dailyPercent}%`,
    );
  }
  if (usage.weeklyPercent != null && usage.weeklyPercent >= limits.weeklyPercent) {
    crossed.push(
      `周窗口(7d) ${fmt(usage.weeklyPercent)}% ≥ 红线 ${limits.weeklyPercent}%`,
    );
  }

  if (crossed.length > 0) {
    return {
      allow: false,
      reason: humanDeny(crossed, state),
      crossed,
      failOpen: false,
    };
  }

  return { allow: true, reason: null, crossed: [], failOpen: false };
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : Number(n).toFixed(1);
}

function humanDeny(crossed, state) {
  const parts = [`prompt-cap 硬停：${crossed.join('；')}`];
  const r5 = state.resetsAt?.fiveHour;
  const r7 = state.resetsAt?.sevenDay;
  const tips = [];
  if (r5) tips.push(`5h 重置约 ${isoFromEpoch(r5)}`);
  if (r7) tips.push(`7d 重置约 ${isoFromEpoch(r7)}`);
  if (tips.length) parts.push(tips.join('，'));
  parts.push('请 checkpoint 进度后停止；或本机执行：prompt-cap resume 30');
  return parts.join('。');
}

function isoFromEpoch(sec) {
  try {
    return new Date(Number(sec) * 1000).toISOString();
  } catch {
    return String(sec);
  }
}
