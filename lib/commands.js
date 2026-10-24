import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONFIG_PATH,
  STATE_PATH,
  DATA_DIR,
  DEFAULT_LIMITS,
} from './paths.js';
import {
  loadConfig,
  saveConfig,
  loadState,
  saveState,
  defaultConfig,
  defaultState,
} from './store.js';
import { decide } from './decide.js';
import {
  captureFromStatuslineJson,
  injectUsage,
  usageFreshness,
  STALE_AFTER_SEC,
} from './usage.js';
import {
  wireClaudeSettings,
  unwireClaudeSettings,
  doctorClaudeSettings,
  PRETOOLUSE_HOOK,
  CAPTURE_STATUSLINE,
  SETTINGS_PATH,
} from './claude-settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function cmdSetup(args = []) {
  const noWire = args.includes('--no-wire');
  const config = defaultConfig();
  config.installedAt = new Date().toISOString();
  config.limits = { ...DEFAULT_LIMITS };
  config.enforced = true;
  saveConfig(config);
  saveState(defaultState());

  console.log('prompt-cap setup OK');
  console.log(`  data dir : ${DATA_DIR}`);
  console.log(`  config   : ${CONFIG_PATH}`);
  console.log(`  state    : ${STATE_PATH}`);
  console.log('  defaults :');
  console.log(`    prompt%(5h) = ${config.limits.promptPercent}`);
  console.log(`    daily%      = ${config.limits.dailyPercent}  (Claude 无独立日窗口，默认不触发)`);
  console.log(`    weekly%(7d) = ${config.limits.weeklyPercent}`);
  console.log(`  hook     : ${PRETOOLUSE_HOOK}`);
  console.log(`  statusline: ${CAPTURE_STATUSLINE}`);

  if (noWire) {
    console.log('');
    console.log('已跳过写入 Claude settings（--no-wire）。稍后可执行：prompt-cap wire');
    return;
  }

  try {
    const result = wireClaudeSettings();
    console.log('');
    console.log('已写入/合并 Claude Code settings.json');
    console.log(`  settings : ${result.settingsPath}`);
    if (result.backup) console.log(`  backup   : ${result.backup}`);
    if (result.chainedInner) {
      console.log(`  已链式保留原 statusLine: ${result.chainedInner}`);
    }
    console.log('  已挂: statusLine(refreshInterval=60) + PreToolUse(*)');
    console.log('');
    console.log('下一步：重启 Claude Code（或等 settings 热重载），发一条消息让 statusline 捕获用量。');
  } catch (err) {
    console.error('');
    console.error(`写入 Claude settings 失败: ${err.message}`);
    console.error('本地 config/state 已就绪；可稍后手动：prompt-cap wire');
    process.exitCode = 1;
  }
}

export function cmdWire() {
  loadConfig(); // ensure defaults exist
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('请先运行 prompt-cap setup');
    process.exitCode = 1;
    return;
  }
  const result = wireClaudeSettings();
  console.log('prompt-cap wire OK');
  console.log(`  settings : ${result.settingsPath}`);
  if (result.backup) console.log(`  backup   : ${result.backup}`);
  console.log(`  PreToolUse → ${result.pretooluse}`);
  console.log(`  statusLine → ${result.statusline}`);
}

export function cmdUnwire() {
  const result = unwireClaudeSettings();
  console.log('prompt-cap unwire OK');
  console.log(`  settings : ${result.settingsPath}`);
  if (result.backup) console.log(`  backup   : ${result.backup}`);
  console.log(result.removed ? '  已移除 prompt-cap 的 hook/statusLine' : '  无需移除（settings 不存在或为空）');
}

export function cmdStatus() {
  const config = loadConfig();
  const state = loadState();
  const decision = decide(config, state);
  const fresh = usageFreshness(state);

  console.log('prompt-cap status');
  console.log(`  enforced     : ${config.enforced}`);
  console.log(`  resumeUntil  : ${config.resumeUntil ?? '(none)'}`);
  console.log('  limits:');
  console.log(`    prompt%(5h) = ${config.limits?.promptPercent}`);
  console.log(`    daily%      = ${config.limits?.dailyPercent}`);
  console.log(`    weekly%(7d) = ${config.limits?.weeklyPercent}`);
  console.log('  usage:');
  console.log(`    prompt%(5h) = ${state.usage?.promptPercent ?? 'null'}`);
  console.log(`    daily%      = ${state.usage?.dailyPercent ?? 'null'}`);
  console.log(`    weekly%(7d) = ${state.usage?.weeklyPercent ?? 'null'}`);
  console.log(`  capturedAt   : ${state.capturedAt ?? '(never)'}  (stale>${STALE_AFTER_SEC}s)`);
  console.log(`  freshness    : ${fresh.stale ? `STALE — ${fresh.reason}` : 'OK'}`);
  console.log(`  decision     : ${decision.allow ? 'ALLOW' : 'DENY'}${decision.failOpen ? ' (fail-open)' : ''}`);
  if (decision.reason) console.log(`  reason       : ${decision.reason}`);
  console.log(`  lastDecision : ${state.lastDecision ?? '(none)'}`);
  console.log(`  lastChecked  : ${state.lastCheckedAt ?? '(never)'}`);
}

export function cmdDoctor() {
  const d = doctorClaudeSettings();
  const configExists = fs.existsSync(CONFIG_PATH);
  const stateExists = fs.existsSync(STATE_PATH);
  console.log('prompt-cap doctor');
  console.log(`  config       : ${configExists ? 'OK' : 'MISSING'}  ${CONFIG_PATH}`);
  console.log(`  state        : ${stateExists ? 'OK' : 'MISSING'}  ${STATE_PATH}`);
  console.log(`  settings.json: ${d.settingsExists ? 'OK' : 'MISSING'}  ${d.settingsPath}`);
  console.log(`  PreToolUse   : ${d.pretooluseWired ? 'WIRED' : 'NOT WIRED'}`);
  console.log(`  statusLine   : ${d.statusLineWired ? 'WIRED' : 'NOT WIRED'}`);
  console.log(`  hook file    : ${d.hookFileExists ? 'OK' : 'MISSING'}  ${PRETOOLUSE_HOOK}`);
  console.log(`  capture file : ${d.captureFileExists ? 'OK' : 'MISSING'}  ${CAPTURE_STATUSLINE}`);
  if (d.innerStatusLine) console.log(`  chained SL   : ${d.innerStatusLine}`);
  if (d.meta) console.log(`  wiredAt      : ${d.meta.wiredAt}`);

  const ok =
    configExists &&
    stateExists &&
    d.hookFileExists &&
    d.captureFileExists &&
    d.pretooluseWired &&
    d.statusLineWired;
  console.log('');
  console.log(ok ? '结论: 接线完整。需在已登录 Pro/Max 的 Claude Code 会话里验证真硬停。' : '结论: 尚不完整。先 setup / wire，再在装了 Claude Code 的机器上验收。');
  if (!ok) process.exitCode = 1;
}

/**
 * prompt-cap set prompt=80 daily=90 weekly=95
 * prompt-cap set enforced=true|false
 */
export function cmdSet(args) {
  const config = loadConfig();
  let changed = false;

  for (const raw of args) {
    const m = String(raw).match(/^(?:--)?(prompt|daily|weekly|enforced)=(.+)$/i);
    if (!m) {
      console.error(`unrecognized set arg: ${raw}`);
      console.error('usage: prompt-cap set prompt=80 daily=90 weekly=95');
      console.error('       prompt-cap set enforced=true|false');
      process.exitCode = 1;
      return;
    }
    const key = m[1].toLowerCase();
    const val = m[2];

    if (key === 'enforced') {
      config.enforced = val === 'true' || val === '1' || val === 'on';
      changed = true;
      continue;
    }

    const n = Number(val);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      console.error(`invalid percent for ${key}: ${val}`);
      process.exitCode = 1;
      return;
    }
    const map = { prompt: 'promptPercent', daily: 'dailyPercent', weekly: 'weeklyPercent' };
    config.limits[map[key]] = n;
    changed = true;
  }

  if (!changed) {
    console.error('nothing to set');
    process.exitCode = 1;
    return;
  }

  saveConfig(config);
  console.log('prompt-cap set OK');
  console.log(JSON.stringify(config.limits, null, 2));
  console.log(`enforced: ${config.enforced}`);
}

/**
 * prompt-cap resume [minutes]
 */
export function cmdResume(args) {
  const minutes = args[0] != null ? Number(args[0]) : 30;
  if (!Number.isFinite(minutes) || minutes <= 0) {
    console.error('usage: prompt-cap resume [minutes]');
    process.exitCode = 1;
    return;
  }

  const config = loadConfig();
  const until = new Date(Date.now() + minutes * 60 * 1000);
  config.resumeUntil = until.toISOString();
  saveConfig(config);

  console.log(`prompt-cap resume OK — 硬停暂停 ${minutes} 分钟`);
  console.log(`  resumeUntil: ${config.resumeUntil}`);
}

/**
 * prompt-cap inject prompt=99 weekly=10
 * 假用量自测（无需 Claude Code）
 */
export function cmdInject(args) {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('请先运行 prompt-cap setup');
    process.exitCode = 1;
    return;
  }
  const opts = {
    promptPercent: null,
    dailyPercent: null,
    weeklyPercent: null,
  };
  for (const raw of args) {
    const m = String(raw).match(/^(?:--)?(prompt|daily|weekly)=(.+)$/i);
    if (!m) {
      console.error(`unrecognized inject arg: ${raw}`);
      console.error('usage: prompt-cap inject prompt=99 weekly=40');
      process.exitCode = 1;
      return;
    }
    const n = Number(m[2]);
    if (!Number.isFinite(n)) {
      console.error(`invalid number: ${m[2]}`);
      process.exitCode = 1;
      return;
    }
    const map = { prompt: 'promptPercent', daily: 'dailyPercent', weekly: 'weeklyPercent' };
    opts[map[m[1].toLowerCase()]] = n;
  }
  const now = Math.floor(Date.now() / 1000);
  const state = injectUsage({
    ...opts,
    capturedAt: now,
    fiveHourResetsAt: now + 3600,
    sevenDayResetsAt: now + 86400,
  });
  console.log('prompt-cap inject OK（假用量，仅供自测）');
  console.log(JSON.stringify(state.usage, null, 2));
  console.log('试跑 hook: echo \'{"tool_name":"Bash"}\' | node hooks/pretooluse.js ; echo exit:$?');
}

/**
 * prompt-cap capture  — 从 stdin 读一条 statusline JSON 写入 state
 */
export async function cmdCapture() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  let payload = {};
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      console.error('stdin 不是合法 JSON');
      process.exitCode = 1;
      return;
    }
  }
  const state = captureFromStatuslineJson(payload);
  console.log('prompt-cap capture OK');
  console.log(JSON.stringify({ usage: state.usage, capturedAt: state.capturedAt, resetsAt: state.resetsAt }, null, 2));
}

/** Remove local config/state; optionally --unwire Claude settings. */
export function cmdRemove(args = []) {
  const alsoUnwire = args.includes('--unwire') || args.includes('--all');
  for (const p of [CONFIG_PATH, STATE_PATH]) {
    try {
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
        console.log(`removed ${p}`);
      }
    } catch (err) {
      console.error(`failed to remove ${p}: ${err.message}`);
    }
  }
  try {
    if (fs.existsSync(DATA_DIR) && fs.readdirSync(DATA_DIR).length === 0) {
      fs.rmdirSync(DATA_DIR);
      console.log(`removed empty ${DATA_DIR}`);
    }
  } catch {
    /* keep dir if non-empty */
  }
  if (alsoUnwire) {
    cmdUnwire();
  } else {
    console.log('prompt-cap remove done — 未改 Claude settings；加 --unwire 可同时卸 hook。');
  }
}

export function printHelp() {
  console.log(`prompt-cap — 单账号 Claude Code 硬停 CLI

Usage:
  prompt-cap setup [--no-wire]   建 ~/.prompt-cap + 写入 Claude settings（备份原文件）
  prompt-cap wire                仅合并 PreToolUse + statusLine 到 ~/.claude/settings.json
  prompt-cap unwire              仅移除本工具写入的 hook/statusLine
  prompt-cap status              线 / 用量 / freshness / allow|deny
  prompt-cap doctor              检查接线是否完整
  prompt-cap set KEY=VAL...      prompt=/daily=/weekly= 或 enforced=true|false
  prompt-cap resume [minutes]    临时放行（默认 30 分钟）
  prompt-cap inject prompt=99    写入假用量（自测 deny）
  prompt-cap capture             从 stdin 读 statusline JSON → state
  prompt-cap remove [--unwire]   删本地数据；可选卸 hook
  prompt-cap help

用量来源（Claude Code ≥2.1，Pro/Max）:
  statusLine.rate_limits.five_hour → prompt%
  statusLine.rate_limits.seven_day → weekly%
  PreToolUse 本身收不到 rate_limits，故必须挂 statusLine。

Defaults: prompt%(5h)=${DEFAULT_LIMITS.promptPercent} daily%=${DEFAULT_LIMITS.dailyPercent} weekly%(7d)=${DEFAULT_LIMITS.weeklyPercent}
Docs: docs/hooks.md
`);
}
