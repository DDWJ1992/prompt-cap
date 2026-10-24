/**
 * Merge / restore Claude Code ~/.claude/settings.json for prompt-cap.
 * Backs up before write. Absolute paths for hook + statusline commands.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

export const CLAUDE_DIR = path.join(os.homedir(), '.claude');
export const SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json');

export const PRETOOLUSE_HOOK = path.join(REPO_ROOT, 'hooks', 'pretooluse.js');
export const CAPTURE_STATUSLINE = path.join(REPO_ROOT, 'hooks', 'capture-statusline.js');

const MARKER = 'prompt-cap';

function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return {};
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeSettings(obj) {
  if (!fs.existsSync(CLAUDE_DIR)) fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

export function backupSettings() {
  if (!fs.existsSync(SETTINGS_PATH)) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const bak = path.join(CLAUDE_DIR, `settings.json.bak.prompt-cap.${stamp}`);
  fs.copyFileSync(SETTINGS_PATH, bak);
  return bak;
}

function nodeCmd(scriptAbs) {
  // exec-ish shell form with quoted absolute path (spaces-safe)
  return `node ${JSON.stringify(scriptAbs)}`;
}

function isOursHook(handler) {
  if (!handler || handler.type !== 'command') return false;
  const c = String(handler.command || '');
  const args = Array.isArray(handler.args) ? handler.args.map(String).join(' ') : '';
  const blob = `${c} ${args}`;
  return blob.includes('prompt-cap') && blob.includes('pretooluse');
}

function isOursStatusLine(sl) {
  if (!sl || sl.type !== 'command') return false;
  return String(sl.command || '').includes('capture-statusline') && String(sl.command || '').includes('prompt-cap');
}

/**
 * Merge PreToolUse + statusLine into user settings.
 * Preserves existing unrelated hooks; chains prior statusLine via env in capture script.
 * @returns {{ backup: string|null, settingsPath: string, pretooluse: string, statusline: string, chainedInner: string|null }}
 */
export function wireClaudeSettings({ refreshInterval = 60 } = {}) {
  const backup = backupSettings();
  const settings = readSettings();

  // --- statusLine ---
  let chainedInner = null;
  const prev = settings.statusLine;
  if (prev && !isOursStatusLine(prev) && prev.type === 'command' && prev.command) {
    chainedInner = prev.command;
    // Persist so capture can pick it up even if env unset
    settings._promptCapInnerStatusLine = chainedInner;
  } else if (settings._promptCapInnerStatusLine) {
    chainedInner = settings._promptCapInnerStatusLine;
  }

  const captureCmd = chainedInner
    ? `PROMPT_CAP_INNER_STATUSLINE=${JSON.stringify(chainedInner)} node ${JSON.stringify(CAPTURE_STATUSLINE)}`
    : nodeCmd(CAPTURE_STATUSLINE);

  settings.statusLine = {
    type: 'command',
    command: captureCmd,
    refreshInterval,
  };

  // --- PreToolUse ---
  if (!settings.hooks || typeof settings.hooks !== 'object') settings.hooks = {};
  if (!Array.isArray(settings.hooks.PreToolUse)) settings.hooks.PreToolUse = [];

  // Remove prior prompt-cap handlers, keep others
  settings.hooks.PreToolUse = settings.hooks.PreToolUse.map((group) => {
    if (!group || !Array.isArray(group.hooks)) return group;
    return {
      ...group,
      hooks: group.hooks.filter((h) => !isOursHook(h)),
    };
  }).filter((group) => group && Array.isArray(group.hooks) && group.hooks.length > 0);

  const handler = {
    type: 'command',
    command: 'node',
    args: [PRETOOLUSE_HOOK],
    timeout: 15,
    statusMessage: 'prompt-cap 检查用量…',
    // fail-open on crash/timeout — never brick Claude Code
    onFailure: 'continue',
  };

  // Prefer a dedicated matcher group tagged in comment via matcher *
  settings.hooks.PreToolUse.push({
    matcher: '*',
    hooks: [handler],
  });

  settings._promptCap = {
    version: 1,
    wiredAt: new Date().toISOString(),
    pretooluse: PRETOOLUSE_HOOK,
    statusline: CAPTURE_STATUSLINE,
    marker: MARKER,
  };

  writeSettings(settings);
  return {
    backup,
    settingsPath: SETTINGS_PATH,
    pretooluse: PRETOOLUSE_HOOK,
    statusline: CAPTURE_STATUSLINE,
    chainedInner,
  };
}

/**
 * Remove only prompt-cap entries; restore prior statusLine if we saved it.
 */
export function unwireClaudeSettings() {
  const backup = backupSettings();
  const settings = readSettings();
  if (!settings || Object.keys(settings).length === 0) {
    return { backup, removed: false, settingsPath: SETTINGS_PATH };
  }

  if (Array.isArray(settings.hooks?.PreToolUse)) {
    settings.hooks.PreToolUse = settings.hooks.PreToolUse.map((group) => {
      if (!group || !Array.isArray(group.hooks)) return group;
      return { ...group, hooks: group.hooks.filter((h) => !isOursHook(h)) };
    }).filter((g) => g && Array.isArray(g.hooks) && g.hooks.length > 0);
    if (settings.hooks.PreToolUse.length === 0) delete settings.hooks.PreToolUse;
    if (settings.hooks && Object.keys(settings.hooks).length === 0) delete settings.hooks;
  }

  if (isOursStatusLine(settings.statusLine)) {
    if (settings._promptCapInnerStatusLine) {
      settings.statusLine = {
        type: 'command',
        command: settings._promptCapInnerStatusLine,
      };
    } else {
      delete settings.statusLine;
    }
  }
  delete settings._promptCapInnerStatusLine;
  delete settings._promptCap;

  writeSettings(settings);
  return { backup, removed: true, settingsPath: SETTINGS_PATH };
}

export function doctorClaudeSettings() {
  const settings = readSettings();
  const exists = fs.existsSync(SETTINGS_PATH);
  const pretool = Array.isArray(settings.hooks?.PreToolUse)
    ? settings.hooks.PreToolUse.some((g) => g?.hooks?.some(isOursHook))
    : false;
  const status = isOursStatusLine(settings.statusLine);
  const hookFile = fs.existsSync(PRETOOLUSE_HOOK);
  const captureFile = fs.existsSync(CAPTURE_STATUSLINE);
  return {
    settingsPath: SETTINGS_PATH,
    settingsExists: exists,
    pretooluseWired: pretool,
    statusLineWired: status,
    hookFileExists: hookFile,
    captureFileExists: captureFile,
    meta: settings._promptCap ?? null,
    innerStatusLine: settings._promptCapInnerStatusLine ?? null,
  };
}
