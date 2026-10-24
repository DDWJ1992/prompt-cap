import fs from 'node:fs';
import { DATA_DIR, CONFIG_PATH, STATE_PATH, DEFAULT_LIMITS } from './paths.js';

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return structuredClone(fallback);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return structuredClone(fallback);
  }
}

export function writeJson(filePath, data) {
  ensureDir();
  const tmp = `${filePath}.tmp.${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  fs.renameSync(tmp, filePath);
}

export function defaultConfig() {
  return {
    version: 1,
    limits: { ...DEFAULT_LIMITS },
    /** When true, PreToolUse hook should deny tools that would burn usage. */
    enforced: true,
    /** Soft resume window: until this ISO timestamp, skip hard-stop. */
    resumeUntil: null,
    installedAt: null,
  };
}

export function defaultState() {
  return {
    version: 1,
    lastCheckedAt: null,
    /** Unix epoch seconds when statusline last wrote a snapshot. */
    capturedAt: null,
    usage: {
      promptPercent: null, // ← five_hour
      dailyPercent: null, // Claude 无独立日窗口；自测可手工写入
      weeklyPercent: null, // ← seven_day
    },
    resetsAt: {
      fiveHour: null,
      sevenDay: null,
    },
    contextPercent: null,
    lastDecision: null, // 'allow' | 'deny' | null
    lastDenyReason: null,
    lastTool: null,
  };
}

export function loadConfig() {
  const cfg = readJson(CONFIG_PATH, defaultConfig());
  // merge defaults for older files
  cfg.limits = { ...DEFAULT_LIMITS, ...(cfg.limits || {}) };
  if (typeof cfg.enforced !== 'boolean') cfg.enforced = true;
  if (cfg.resumeUntil === undefined) cfg.resumeUntil = null;
  return cfg;
}

export function saveConfig(config) {
  writeJson(CONFIG_PATH, config);
}

export function loadState() {
  const st = readJson(STATE_PATH, defaultState());
  st.usage = {
    promptPercent: null,
    dailyPercent: null,
    weeklyPercent: null,
    ...(st.usage || {}),
  };
  st.resetsAt = {
    fiveHour: null,
    sevenDay: null,
    ...(st.resetsAt || {}),
  };
  return st;
}

export function saveState(state) {
  writeJson(STATE_PATH, state);
}
