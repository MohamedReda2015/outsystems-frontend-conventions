// Structural checks that keep the skill publishable and internally consistent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT, p } from './helpers.mjs';
import { RULES as JS_RULES } from '../scripts/lint-os-js.mjs';
import { RULES as NAME_RULES } from '../scripts/check-names.mjs';

const read = (f) => readFileSync(p(f), 'utf8');
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  // `private/` holds local-only design profiles (git-ignored, may contain client brands): never scanned or published.
  if (['node_modules', '.git', 'dist', 'private'].includes(e.name)) return [];
  const full = join(dir, e.name);
  return e.isDirectory() ? walk(full) : [full];
});
const allFiles = walk(ROOT).map((f) => relative(ROOT, f).replace(/\\/g, '/'));
const docFiles = allFiles.filter((f) => /\.(md|mdc|mjs|js|json)$/.test(f) && !f.startsWith('tests/'));

const skill = read('SKILL.md');
const frontmatter = skill.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';

const OWN = 'NAM|STR|BLK|NAV|LCY|FET|STA|CLG|VAL|ERR|JSC|FSC|FPF|MOB|LOC|VER|FRV';
const checklist = read('references/review-checklist.md');
const defined = new Set([...checklist.matchAll(new RegExp(`^\\| ((?:${OWN})-\\d{2}) \\|`, 'gm'))].map((m) => m[1]));
const lessons = new Set([...read('references/lessons-learned.md').matchAll(/\*\*(FLL-\d{2})/g)].map((m) => m[1]));

test('SKILL.md frontmatter: name, description, license, version', () => {
  assert.match(frontmatter, /^name: outsystems-frontend-conventions$/m);
  const desc = frontmatter.match(/^description: (.*)$/m)?.[1] ?? '';
  assert.ok(desc.length > 100 && desc.length <= 1024, `description length ${desc.length}`);
  assert.ok(!/[<>]/.test(desc), 'description must not contain angle brackets');
  assert.match(frontmatter, /^license: MIT$/m);
  const version = frontmatter.match(/^\s+version: (\S+)$/m)?.[1];
  assert.equal(version, JSON.parse(read('package.json')).version, 'SKILL.md and package.json versions differ');
  assert.ok(read('CHANGELOG.md').includes(`## [${version}]`), 'CHANGELOG has no entry for the current version');
});

test('SKILL.md stays lean (< 300 lines)', () => {
  assert.ok(skill.split('\n').length < 300);
});

test('Every referenced skill path exists', () => {
  for (const f of docFiles.filter((x) => /\.(md|mdc)$/.test(x))) {
    for (const m of read(f).matchAll(/`(?:outsystems-frontend-conventions\/)?((?:references|templates|scripts|adapters|tests|docs)\/[\w.\-/]+\.(?:md|mjs|js|json|mdc))`/g)) {
      assert.ok(existsSync(p(m[1])), `${f} references missing ${m[1]}`);
    }
  }
});

test('Rule IDs: defined once; every cited own ID is defined', () => {
  const all = [...checklist.matchAll(/^\| ([A-Z0-9]+-\d{2}) \|/gm)].map((m) => m[1]);
  const dup = all.filter((id, i) => all.indexOf(id) !== i);
  assert.deepEqual(dup, [], `duplicate IDs ${dup}`);
  assert.ok(defined.size >= 80, `only ${defined.size} IDs`);
  for (const f of docFiles) {
    for (const m of read(f).matchAll(new RegExp(`\\b((?:${OWN})-\\d{2})\\b`, 'g'))) {
      assert.ok(defined.has(m[1]), `${f} cites undefined ${m[1]}`);
    }
    for (const m of read(f).matchAll(/\b(FLL-\d{2})\b/g)) assert.ok(lessons.has(m[1]), `${f} cites undefined ${m[1]}`);
  }
});

test('Script rule tables match the checklist severities', () => {
  for (const [id, [sev]] of Object.entries({ ...JS_RULES, ...NAME_RULES })) {
    if (!new RegExp(`^(?:${OWN})-`).test(id)) continue; // companion-skill IDs
    const row = checklist.match(new RegExp(`^\\| ${id} \\|[^|]*\\| (\\w+)`, 'm'));
    assert.ok(row, `${id} used by a script but not in the checklist`);
    if (id.startsWith('JSC-')) assert.equal(row[1], sev, `${id} severity differs (checklist ${row[1]}, script ${sev})`);
  }
});

test('Companion-skill IDs exist in the sibling skills when they are installed next to this one', () => {
  const siblings = {
    'outsystems-architecture': /\b((?:ARC|HSE|DAT|INT|UI|PERF|SEC|AUD|MNT|OPS|TST)-\d{2})\b/g,
    'outsystems-live-style-guide': /\b((?:TOK|THM|LAY|RSP|A11Y|CMP|FRM|LST|FDB|TXT|PRF|GOV|LES)-\d{2})\b/g,
  };
  for (const [name, re] of Object.entries(siblings)) {
    const dir = join(ROOT, '..', name);
    if (!existsSync(join(dir, 'references', 'review-checklist.md'))) continue;
    const theirs = readFileSync(join(dir, 'references', 'review-checklist.md'), 'utf8') +
      (existsSync(join(dir, 'references', 'lessons-learned.md')) ? readFileSync(join(dir, 'references', 'lessons-learned.md'), 'utf8') : '');
    for (const f of docFiles) {
      for (const m of read(f).matchAll(re)) {
        assert.ok(new RegExp(`\\b${m[1]}\\b`).test(theirs), `${f} cites ${m[1]}, which ${name} does not define`);
      }
    }
  }
});

test('Copilot adapter carries the core rules verbatim', () => {
  const copilot = read('adapters/copilot-instructions.md');
  const block = copilot.split('<!-- BEGIN core rules: keep in sync with adapters/core-rules.md -->')[1]?.split('<!-- END core rules -->')[0]?.trim();
  const core = read('adapters/core-rules.md').slice(read('adapters/core-rules.md').indexOf('**Companions**')).trim();
  assert.equal(block, core);
});

test('No e-mail addresses, secrets or private names in the skill', () => {
  // Generic patterns are public. Client/project names to ban are kept OUT of the repository:
  // put one per line in `.private-names` (git-ignored) or in the PRIVATE_NAMES env var (comma-separated).
  const generic = /[\w.+-]+@(?!example\.)[\w-]+\.[\w.]+|BEGIN [A-Z ]*PRIVATE KEY|\b(?:ghp|gho|github_pat)_[A-Za-z0-9_]{20,}|\bAKIA[0-9A-Z]{16}\b/;
  const listFile = p('.private-names');
  const names = [
    ...(existsSync(listFile) ? readFileSync(listFile, 'utf8').split(/\r?\n/) : []),
    ...(process.env.PRIVATE_NAMES || '').split(','),
  ].map((n) => n.trim()).filter((n) => n && !n.startsWith('#'));
  const esc = (n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const privateRe = names.length ? new RegExp(`\\b(?:${names.map(esc).join('|')})\\b`) : null;
  const files = allFiles.filter((f) => /\.(md|mdc|mjs|js|json|yml|yaml|txt)$/.test(f) && f !== 'tests/skill.test.mjs');
  for (const f of files) {
    const text = read(f);
    assert.ok(!generic.test(text), `${f} contains an e-mail address or secret`);
    if (privateRe) assert.ok(!privateRe.test(text), `${f} contains a private name from .private-names`);
  }
});
