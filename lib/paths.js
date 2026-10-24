import os from 'node:os';
import path from 'node:path';

/** Local data dir: ~/.prompt-cap/ */
export const DATA_DIR = path.join(os.homedir(), '.prompt-cap');
export const CONFIG_PATH = path.join(DATA_DIR, 'config.json');
export const STATE_PATH = path.join(DATA_DIR, 'state.json');

/** Suggested defaults (percent of Claude usage budget). */
export const DEFAULT_LIMITS = {
  promptPercent: 80,
  dailyPercent: 90,
  weeklyPercent: 95,
};
