#!/usr/bin/env node
/**
 * Typography guardrail — fails if JSX uses inline fontSize/fontWeight (except Recharts).
 * Run: node scripts/audit-typography.mjs
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');

const ALLOWED = [
  /axisTickStyle/, // Recharts
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith('.jsx')) files.push(p);
  }
  return files;
}

const violations = [];

for (const file of walk(SRC)) {
  const content = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file);
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (!/fontSize|fontWeight/.test(line)) return;
    if (ALLOWED.some((re) => re.test(line))) return;
    violations.push({ file: rel, line: i + 1, text: line.trim() });
  });
}

if (violations.length) {
  console.error(`Typography audit failed: ${violations.length} inline font rule(s)\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.text.slice(0, 100)}`);
  }
  process.exit(1);
}

console.log('Typography audit passed: no inline fontSize/fontWeight in src/*.jsx');
