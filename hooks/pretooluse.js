#!/usr/bin/env node
/**
 * Claude Code PreToolUse hook — hard-stop when usage crosses lines.
 *
 * Official deny shape (exit 0 + JSON):
 *   hookSpecificOutput.permissionDecision = "deny" | "allow" | "ask"
 * Also supports exit 2 + stderr as block.
 *
 * Fail-open: missing/stale usage → allow (exit 0, no deny).
 */
import fs from 'node:fs';
import { loadConfig, loadState, saveState } from '../lib/store.js';
import { decide } from '../lib/decide.js';
import { usageFreshness } from '../lib/usage.js';

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { _raw: raw };
  }
}

function emitAllow() {
  process.exit(0);
}

function emitDeny(reason) {
  const out = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
    // Also stop the agentic turn so it doesn't hammer retries
    continue: false,
    stopReason: reason,
  };
  process.stdout.write(JSON.stringify(out) + '\n');
  process.exit(0);
}

try {
  const event = await readStdin();
  const config = loadConfig();
  const state = loadState();

  // Window already reset → treat as no reading (fail-open until statusline refreshes)
  const freshness = usageFreshness(state);
  if (freshness.stale && freshness.reason?.includes('已重置')) {
    try {
      state.usage = { promptPercent: null, dailyPercent: null, weeklyPercent: null };
      saveState(state);
    } catch {
      /* ignore */
    }
  }

  const decision = decide(config, state);

  try {
    state.lastCheckedAt = new Date().toISOString();
    state.lastDecision = decision.allow ? 'allow' : 'deny';
    state.lastDenyReason = decision.allow ? null : decision.reason;
    state.lastTool = event?.tool_name ?? event?.toolName ?? null;
    saveState(state);
  } catch {
    /* ignore */
  }

  if (!decision.allow) {
    emitDeny(decision.reason || 'prompt-cap 硬停');
  }
  emitAllow();
} catch (err) {
  // Absolute fail-open
  try {
    fs.appendFileSync(
      new URL('../.prompt-cap-hook-error.log', import.meta.url),
      `${new Date().toISOString()} ${err?.stack || err}\n`,
    );
  } catch {
    /* ignore */
  }
  process.exit(0);
}
