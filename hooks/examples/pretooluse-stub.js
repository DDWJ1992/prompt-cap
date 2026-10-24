#!/usr/bin/env node
/** @deprecated use ../pretooluse.js — thin wrapper for old paths */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const real = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../pretooluse.js');
const chunks = [];
for await (const c of process.stdin) chunks.push(c);
const r = spawnSync(process.execPath, [real], {
  input: Buffer.concat(chunks),
  encoding: 'buffer',
});
if (r.stdout?.length) process.stdout.write(r.stdout);
if (r.stderr?.length) process.stderr.write(r.stderr);
process.exit(r.status ?? 0);
