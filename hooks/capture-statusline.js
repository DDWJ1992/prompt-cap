#!/usr/bin/env node
/**
 * Claude Code statusLine command.
 * Reads session JSON (incl. rate_limits) from stdin, writes ~/.prompt-cap/state.json,
 * then prints a short status line (or chains an existing statusline via
 * PROMPT_CAP_INNER_STATUSLINE).
 */
import { spawn } from 'node:child_process';
import { captureFromStatuslineJson } from '../lib/usage.js';

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function fmtLeft(epochSec) {
  if (epochSec == null) return '';
  const diff = Math.max(0, Number(epochSec) - Math.floor(Date.now() / 1000));
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (d > 0) return `${d}d${h}h`;
  if (h > 0) return `${h}h${m}m`;
  return `${m}m`;
}

function renderLine(payload) {
  const model = payload?.model?.display_name || 'Claude';
  const ctx = payload?.context_window?.used_percentage;
  const p5 = payload?.rate_limits?.five_hour?.used_percentage;
  const r5 = payload?.rate_limits?.five_hour?.resets_at;
  const p7 = payload?.rate_limits?.seven_day?.used_percentage;
  const r7 = payload?.rate_limits?.seven_day?.resets_at;

  const parts = [model];
  if (ctx != null) parts.push(`ctx ${Math.round(Number(ctx))}%`);
  if (p5 != null) {
    let s = `5h ${Math.round(Number(p5))}%`;
    const left = fmtLeft(r5);
    if (left) s += ` (${left})`;
    parts.push(s);
  }
  if (p7 != null) {
    let s = `7d ${Math.round(Number(p7))}%`;
    const left = fmtLeft(r7);
    if (left) s += ` (${left})`;
    parts.push(s);
  }
  if (p5 == null && p7 == null) parts.push('cap:no-rl');
  return parts.join(' | ');
}

const payload = await readStdin();

try {
  captureFromStatuslineJson(payload);
} catch {
  /* never break statusline */
}

const inner = process.env.PROMPT_CAP_INNER_STATUSLINE;
if (inner && inner.trim()) {
  await new Promise((resolve) => {
    const child = spawn(inner, {
      shell: true,
      stdio: ['pipe', 'inherit', 'inherit'],
    });
    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
    child.on('close', () => resolve());
    child.on('error', () => resolve());
  });
  process.exit(0);
}

process.stdout.write(renderLine(payload) + '\n');
process.exit(0);
