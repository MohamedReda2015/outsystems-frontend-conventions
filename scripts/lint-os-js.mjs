#!/usr/bin/env node
// Lints OutSystems JavaScript nodes and script resources against the JSC rules
// of the outsystems-frontend-conventions skill. Zero dependencies (Node 18+).
//
//   node scripts/lint-os-js.mjs <file-or-folder> [...more] [--json] [--list-rules]
//
// Put one JavaScript node per .js file (copy it from Service Studio). Files linted
// together are treated as one block/screen when checking cleanup (JSC-05), so lint a
// block's OnReady and OnDestroy nodes in the same run.
// Suppress a finding with a reason on the same line or the line above:
//   // jsc-ignore JSC-09: corporate theme requires jQuery
// Exit codes: 0 = no Blocker/Major findings, 1 = Blocker/Major found, 2 = usage error.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

export const RULES = {
  'JSC-01': ['Major', 'Hard-coded element id or generated-id selector; pass Widget.Id in through $parameters'],
  'JSC-02': ['Blocker', 'eval / new Function / string timer executes arbitrary code'],
  'JSC-03': ['Blocker', 'HTML injection sink with non-literal content (XSS); use textContent or sanitize'],
  'JSC-04': ['Major', 'Global variable; keep instances in an Object variable or one namespace'],
  'JSC-05': ['Major', 'Started here but never cleaned up in the linted set; undo it in OnDestroy'],
  'JSC-06': ['Blocker', 'Sensitive value written to browser storage or cookies'],
  'JSC-07': ['Major', 'Asynchronous code without $resolve()/$reject(); the flow continues before the work ends'],
  'JSC-08': ['Minor', 'Debug output left in code; use $public.Logger or a wrapped log action'],
  'JSC-09': ['Minor', 'jQuery used; prefer native DOM APIs unless the theme requires jQuery'],
  'JSC-10': ['Major', 'Direct HTTP call from JS; expose a server action instead'],
  'JSC-11': ['Major', 'Inline event handler or javascript: URL (breaks CSP, injection risk)'],
  'JSC-12': ['Minor', 'Browser alert/confirm/prompt; use the feedback helper or a Popup'],
  'JSC-13': ['Major', 'Hard-coded URL or secret; read it from configuration through a server action'],
  'JSC-14': ['Minor', 'Literal style values set from JS; use a Style Classes expression with token-based classes'],
  'JSC-15': ['Minor', 'Missing header comment (purpose, inputs, outputs, async)'],
  'JSC-16': ['Major', 'Asynchronous call without error handling, or $resolve() called with arguments'],
  'JSC-17': ['Major', 'Internal/unsupported platform API; use only $public, $actions, $parameters, $roles'],
  'JSC-18': ['Minor', 'Large JavaScript node; move library or shared code to a Script element'],
  'JSC-19': ['Minor', 'Widget classes changed from JS; use a Style Classes expression (unless the DOM belongs to a third-party component)'],
};

/** Blank out comments (keeping newlines) so patterns don't match commented code. */
export function stripComments(src) {
  let out = '';
  let i = 0;
  let mode = 'code'; // code | line | block | sq | dq | bt
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (mode === 'code') {
      if (c === '/' && n === '/') { mode = 'line'; out += '  '; i += 2; continue; }
      if (c === '/' && n === '*') { mode = 'block'; out += '  '; i += 2; continue; }
      if (c === "'") mode = 'sq'; else if (c === '"') mode = 'dq'; else if (c === '`') mode = 'bt';
      out += c; i++; continue;
    }
    if (mode === 'line') {
      if (c === '\n') { mode = 'code'; out += c; } else out += ' ';
      i++; continue;
    }
    if (mode === 'block') {
      if (c === '*' && n === '/') { mode = 'code'; out += '  '; i += 2; continue; }
      out += c === '\n' ? '\n' : ' '; i++; continue;
    }
    // inside a string
    if (c === '\\') { out += c + (n ?? ''); i += 2; continue; }
    if ((mode === 'sq' && c === "'") || (mode === 'dq' && c === '"') || (mode === 'bt' && c === '`')) mode = 'code';
    if (c === '\n' && mode !== 'bt') mode = 'code';
    out += c; i++;
  }
  return out;
}

const LITERAL = /^\s*(['"])(?:(?!\1)[^\\]|\\.)*\1\s*;?\s*$/; // a single plain string literal

// Line rules: [id, regex, optional filter(match, line) -> boolean]
const LINE_RULES = [
  ['JSC-01', /\bgetElementById\s*\(\s*['"`]/],
  ['JSC-01', /\bquerySelector(?:All)?\s*\(\s*['"`][^'"`]*#[A-Za-z]/],
  ['JSC-01', /\$\(\s*['"`]#[A-Za-z]/],
  ['JSC-01', /['"`][^'"`]*#(?:b\d+-|wt\d|l\d+-)[\w-]*/],
  ['JSC-02', /\beval\s*\(/],
  ['JSC-02', /\bnew\s+Function\s*\(/],
  ['JSC-02', /\bset(?:Timeout|Interval)\s*\(\s*['"`]/],
  ['JSC-03', /\.(?:innerHTML|outerHTML)\s*\+?=(?!=)(.*)$/, (m) => !LITERAL.test(m[1]) || /\$\{/.test(m[1])],
  ['JSC-03', /\binsertAdjacentHTML\s*\(/],
  ['JSC-03', /\bdocument\.write(?:ln)?\s*\(/],
  ['JSC-04', /\b(?:window|globalThis|self)\.([A-Za-z_$][\w$]*)\s*=(?!=)(.*)$/,
    (m) => !['location', 'name', 'status'].includes(m[1]) && !new RegExp(`^\\s*(?:window|globalThis|self)\\.${m[1].replace(/\$/g, '\\$')}\\s*\\|\\|`).test(m[2])],
  ['JSC-06', /\b(?:localStorage|sessionStorage)\.setItem\s*\(\s*[^,]*(?:token|passw|pwd|secret|role|jwt|auth|session|credential|nationalid|emiratesid)/i],
  ['JSC-06', /\b(?:localStorage|sessionStorage)\s*(?:\.|\[\s*['"`])(?:token|password|secret|role|jwt|auth)\w*\s*['"`]?\]?\s*=(?!=)/i],
  ['JSC-06', /\bdocument\.cookie\s*=(?!=)/],
  ['JSC-08', /\bconsole\.(?:log|debug|info|trace|dir|table)\s*\(/],
  ['JSC-08', /^\s*debugger\s*;?\s*$/],
  ['JSC-09', /(?:^|[^\w$.])(?:jQuery|\$)\s*\(\s*(?:['"`]|document\b|window\b|this\b|function\b)/],
  ['JSC-09', /(?:^|[^\w$.])(?:jQuery|\$)\.(?:ajax|each|extend|get|post|fn)\b/],
  ['JSC-10', /(?:^|[^\w$.])fetch\s*\(/],
  ['JSC-10', /\bnew\s+XMLHttpRequest\b/],
  ['JSC-10', /\baxios\s*[.(]/],
  ['JSC-11', /['"`][^'"`]*\bon(?:click|load|error|mouseover|mouseenter|change|submit|focus|blur|keydown|keyup|input)\s*=/i],
  ['JSC-11', /\bsetAttribute\s*\(\s*['"`]on\w+/i],
  ['JSC-11', /['"`]\s*javascript:/i],
  ['JSC-12', /(?:^|[^\w$.]|\bwindow\.)(?:alert|confirm|prompt)\s*\(/],
  ['JSC-13', /['"`](?:https?:)?\/\/(?!www\.w3\.org\/)[a-z0-9.-]+\.[a-z]{2,}/i],
  ['JSC-13', /\b(?:api[_-]?key|apikey|secret|password|passwd|client[_-]?secret|access[_-]?token|bearer)\b\s*[:=]\s*['"`][^'"`\s]{6,}['"`]/i],
  ['JSC-14', /\.style\.(?!display\b|visibility\b)[A-Za-z]+\s*=\s*['"`][^'"`]*(?:#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|\d+(?:\.\d+)?(?:px|rem|em)\b)/i],
  ['JSC-14', /\.style\.cssText\s*=|\bsetAttribute\s*\(\s*['"`]style['"`]/],
  ['JSC-16', /\$resolve\s*\(\s*[^)\s]/],
  ['JSC-17', /\bOutSystems(?:Internal)?\.[A-Za-z_$]|\brequire\s*\(\s*['"`]OutSystems|\$public\.(?!(?:FeedbackMessage|Logger|Security|Validation|Navigation|ApplicationContext|View|ApplicationLifecycle|Device)\b)[A-Za-z_$]/],
  ['JSC-19', /\.classList\.(?:add|remove|toggle|replace)\s*\(|\.className\s*\+?=(?!=)/],
];

// Set-level rules: something started in one file must be undone somewhere in the set.
const CLEANUP_PAIRS = [
  [/\baddEventListener\s*\(/, /\bremoveEventListener\s*\(/, 'addEventListener without removeEventListener'],
  [/\bsetInterval\s*\(/, /\bclearInterval\s*\(/, 'setInterval without clearInterval'],
  [/\bnew\s+(?:Mutation|Resize|Intersection|Performance)Observer\s*\(/, /\.disconnect\s*\(/, 'Observer without disconnect()'],
];

function walk(target, out = []) {
  const st = statSync(target);
  if (st.isDirectory()) {
    for (const name of readdirSync(target)) {
      if (name === 'node_modules' || name.startsWith('.')) continue;
      walk(join(target, name), out);
    }
  } else if (['.js', '.mjs', '.cjs'].includes(extname(target))) out.push(target);
  return out;
}

function suppressed(lines, idx, id) {
  const re = new RegExp(`jsc-ignore\\s+(?:[A-Z]+-\\d+\\s*,\\s*)*${id}\\b\\s*:\\s*\\S`);
  return re.test(lines[idx] || '') || re.test(lines[idx - 1] || '');
}

/** Lint a list of { file, src } entries; returns findings. */
export function lintSources(entries) {
  const findings = [];
  const add = (file, line, id, detail, lines) => {
    if (lines && suppressed(lines, line - 1, id)) return;
    const [severity, message] = RULES[id];
    findings.push({ file, line, id, severity, message: detail ? `${message} (${detail})` : message });
  };
  const allCode = entries.map((e) => stripComments(e.src)).join('\n');

  for (const { file, src } of entries) {
    const lines = src.split(/\r?\n/);
    const code = stripComments(src).split(/\r?\n/);

    code.forEach((line, i) => {
      const seen = new Set();
      for (const [id, re, filter] of LINE_RULES) {
        if (seen.has(id)) continue;
        const m = line.match(re);
        if (m && (!filter || filter(m, line))) { seen.add(id); add(file, i + 1, id, null, lines); }
      }
    });

    // JSC-07: async work without $resolve/$reject
    const codeText = code.join('\n');
    if (!/\$(?:resolve|reject)\s*\(/.test(codeText)) {
      const strong = codeText.search(/\.then\s*\(|\bawait\b|\bnew\s+Promise\s*\(/);
      if (strong >= 0) {
        const line = codeText.slice(0, strong).split('\n').length;
        add(file, line, 'JSC-07', null, lines);
      }
    }

    // JSC-16: promise chains need error handling (catch, or a two-argument then)
    const hasThen = /\.then\s*\(/.test(codeText);
    const hasCatch = /\.catch\s*\(/.test(codeText);
    const twoArgThen = /\.then\s*\([\s\S]*?\}\s*\)?\s*,\s*(?:function\b|\(?\s*[A-Za-z_$][\w$]*\s*\)?\s*=>)/.test(codeText);
    if (hasThen && !hasCatch && !twoArgThen) {
      const at = codeText.search(/\.then\s*\(/);
      add(file, codeText.slice(0, at).split('\n').length, 'JSC-16', 'then() without catch()', lines);
    }

    // JSC-18: large node (non-blank code lines)
    const codeLines = code.filter((l) => l.trim() !== '').length;
    if (codeLines > 60) add(file, 1, 'JSC-18', `${codeLines} code lines`, lines);

    // JSC-05: cleanup across the linted set
    for (const [start, stop, what] of CLEANUP_PAIRS) {
      const at = codeText.search(start);
      if (at >= 0 && !stop.test(allCode)) {
        add(file, codeText.slice(0, at).split('\n').length, 'JSC-05', what, lines);
      }
    }

    // JSC-15: a header comment in the first three non-empty lines
    const head = lines.filter((l) => l.trim() !== '').slice(0, 3);
    if (head.length && !head.some((l) => /^\s*(\/\/|\/\*|\*)/.test(l))) add(file, 1, 'JSC-15', null, lines);
  }
  const order = { Blocker: 0, Major: 1, Minor: 2 };
  return findings.sort((a, b) => order[a.severity] - order[b.severity] || a.file.localeCompare(b.file) || a.line - b.line);
}

function main(argv) {
  const json = argv.includes('--json');
  if (argv.includes('--list-rules')) {
    for (const [id, [sev, msg]] of Object.entries(RULES)) console.log(`${id}  ${sev.padEnd(7)}  ${msg}`);
    return 0;
  }
  const targets = argv.filter((a) => !a.startsWith('--'));
  if (!targets.length) {
    console.error('Usage: node scripts/lint-os-js.mjs <file-or-folder> [...] [--json] [--list-rules]');
    return 2;
  }
  const files = [];
  for (const t of targets) {
    if (!existsSync(t)) { console.error(`Not found: ${t}`); return 2; }
    walk(t, files);
  }
  const entries = files.map((f) => ({ file: relative(process.cwd(), f).replace(/\\/g, '/'), src: readFileSync(f, 'utf8') }));
  const findings = lintSources(entries);
  const count = (s) => findings.filter((f) => f.severity === s).length;
  const summary = { files: entries.length, blocker: count('Blocker'), major: count('Major'), minor: count('Minor') };
  if (json) console.log(JSON.stringify({ summary, findings }, null, 2));
  else {
    for (const f of findings) console.log(`${f.file}:${f.line}  ${f.severity.padEnd(7)}  ${f.id}  ${f.message}`);
    console.log(`\n${summary.files} file(s): ${summary.blocker} Blocker, ${summary.major} Major, ${summary.minor} Minor`);
  }
  return summary.blocker + summary.major > 0 ? 1 : 0;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('lint-os-js.mjs')) process.exitCode = main(process.argv.slice(2));
