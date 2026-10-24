#!/usr/bin/env node
/**
 * Local tests — no Claude Code required.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bin = path.join(root, 'bin', 'prompt-cap.js');
const hook = path.join(root, 'hooks', 'pretooluse.js');
const capture = path.join(root, 'hooks', 'capture-statusline.js');
const dataDir = path.join(os.homedir(), '.prompt-cap');

let failed = 0;
function ok(name, cond, detail = '') {
  if (cond) console.log(`  PASS  ${name}`);
  else {
    console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

function run(args, opts = {}) {
  return spawnSync(process.execPath, [bin, ...args], {
    encoding: 'utf8',
    input: opts.input,
    env: process.env,
  });
}

function runHook(inputObj) {
  return spawnSync(process.execPath, [hook], {
    encoding: 'utf8',
    input: JSON.stringify(inputObj),
  });
}

console.log('prompt-cap self-test');

// clean + setup without touching real Claude settings if possible —
// setup without --no-wire would write settings; use --no-wire then wire into a temp? 
// For box tests: use --no-wire always, test wire against real ~/.claude (backup).
const rem = run(['remove', '--unwire']);
ok('remove exits 0', rem.status === 0, rem.stderr);

const setup = run(['setup', '--no-wire']);
ok('setup --no-wire', setup.status === 0 && setup.stdout.includes('setup OK'), setup.stderr);

const st1 = run(['status']);
ok('status fail-open initially', st1.stdout.includes('ALLOW') && st1.stdout.includes('fail-open'), st1.stdout);

const h1 = runHook({ tool_name: 'Bash' });
ok('hook allow when no usage', h1.status === 0 && !h1.stdout.includes('"deny"'), h1.stdout + h1.stderr);

const inj = run(['inject', 'prompt=99', 'weekly=10']);
ok('inject', inj.status === 0, inj.stderr);

const st2 = run(['status']);
ok('status DENY after inject', st2.stdout.includes('DENY'), st2.stdout);

const h2 = runHook({ tool_name: 'Bash' });
ok('hook deny JSON', h2.status === 0 && h2.stdout.includes('permissionDecision') && h2.stdout.includes('deny'), h2.stdout);
ok('hook Chinese reason', h2.stdout.includes('硬停'), h2.stdout);

const res = run(['resume', '30']);
ok('resume', res.status === 0, res.stderr);
const h3 = runHook({ tool_name: 'Bash' });
ok('hook allow during resume', h3.status === 0 && !h3.stdout.includes('"deny"'), h3.stdout);

// clear resume by setting past
const cfgPath = path.join(dataDir, 'config.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
cfg.resumeUntil = null;
fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');

const payload = {
  model: { display_name: 'Opus' },
  context_window: { used_percentage: 8 },
  rate_limits: {
    five_hour: { used_percentage: 22.5, resets_at: Math.floor(Date.now() / 1000) + 7200 },
    seven_day: { used_percentage: 41, resets_at: Math.floor(Date.now() / 1000) + 86400 },
  },
};
const cap = spawnSync(process.execPath, [capture], {
  encoding: 'utf8',
  input: JSON.stringify(payload),
});
ok('capture-statusline exits 0', cap.status === 0, cap.stderr);
ok('capture prints line', cap.stdout.includes('5h') && cap.stdout.includes('7d'), cap.stdout);

const st3 = run(['status']);
ok('status after capture shows 22.5', st3.stdout.includes('22.5') || st3.stdout.includes('22'), st3.stdout);
ok('decision ALLOW under limits', st3.stdout.includes('ALLOW'), st3.stdout);

// wire / doctor (touches ~/.claude/settings.json with backup)
const wire = run(['wire']);
ok('wire', wire.status === 0, wire.stderr);
const doc = run(['doctor']);
ok('doctor wired', doc.status === 0 && doc.stdout.includes('WIRED'), doc.stdout);

const unwire = run(['unwire']);
ok('unwire', unwire.status === 0, unwire.stderr);

run(['remove']);

console.log('');
if (failed) {
  console.error(`FAILED: ${failed}`);
  process.exit(1);
}
console.log('ALL PASS');
