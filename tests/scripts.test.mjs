import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run, ids } from './helpers.mjs';
import { lintSources, stripComments } from '../scripts/lint-os-js.mjs';
import { checkInventory } from '../scripts/check-names.mjs';

const lint = (src, file = 'node.js') => new Set(lintSources([{ file, src }]).map((f) => f.id));
const HEADER = '// Purpose: test\n// Async: no\n';

test('lint-os-js: bad example hits every expected rule and exits 1', () => {
  const r = run('lint-os-js.mjs', ['scripts/examples/js/bad-chart-onready.js', '--json']);
  assert.equal(r.code, 1);
  for (const id of ['JSC-01', 'JSC-03', 'JSC-04', 'JSC-05', 'JSC-06', 'JSC-07', 'JSC-08', 'JSC-09', 'JSC-10', 'JSC-12', 'JSC-13', 'JSC-14', 'JSC-15', 'JSC-17', 'JSC-19']) {
    assert.ok(ids(r).has(id), `missing ${id}`);
  }
});

test('lint-os-js: async bad example (JSC-16, JSC-17)', () => {
  const r = run('lint-os-js.mjs', ['scripts/examples/js/bad-async-node.js', '--json']);
  assert.equal(r.code, 1);
  assert.ok(ids(r).has('JSC-16') && ids(r).has('JSC-17'));
});

test('lint-os-js: research rules (JSC-16…19)', () => {
  assert.ok(lint(`${HEADER}p.then((r) => { $resolve(); });`).has('JSC-16'), 'then without catch');
  assert.ok(!lint(`${HEADER}p.then((r) => { $resolve(); }).catch((e) => $reject(e));`).has('JSC-16'));
  assert.ok(!lint(`${HEADER}p.then(function (r) { $resolve(); }, function (e) { $reject(e); });`).has('JSC-16'), 'two-argument then');
  assert.ok(lint(`${HEADER}$parameters.X = 1; $resolve($parameters.X);`).has('JSC-16'), '$resolve takes no arguments');
  assert.ok(lint(`${HEADER}OutSystems.Internal.x();`).has('JSC-17'));
  assert.ok(lint(`${HEADER}$public.Secret.go();`).has('JSC-17'));
  assert.ok(!lint(`${HEADER}$public.FeedbackMessage.showFeedbackMessage('x', 1); $public.Logger.log('x');`).has('JSC-17'));
  assert.ok(lint(HEADER + Array.from({ length: 70 }, (_, i) => `const v${i} = ${i};`).join('\n')).has('JSC-18'));
  assert.ok(lint(`${HEADER}el.classList.add('x');`).has('JSC-19'));
  assert.ok(!lint(`${HEADER}// jsc-ignore JSC-19: DOM owned by the chart library\nel.classList.add('x');`).has('JSC-19'));
});

test('lint-os-js: good examples linted together are clean', () => {
  const r = run('lint-os-js.mjs', ['scripts/examples/js', '--json']);
  const bad = r.json.findings.filter((f) => !f.file.includes('bad-'));
  assert.deepEqual(bad, []);
});

test('lint-os-js: OnReady alone reports missing cleanup (JSC-05)', () => {
  const r = run('lint-os-js.mjs', ['scripts/examples/js/good-chart-onready.js', '--json']);
  assert.equal(r.code, 1);
  assert.ok(ids(r).has('JSC-05'));
});

test('lint-os-js: comments are ignored and suppressions need a reason', () => {
  assert.equal(lint(`${HEADER}// eval("x")\n/* console.log(1) */\n`).size, 0);
  assert.ok(!lint(`${HEADER}// jsc-ignore JSC-08: temporary trace for QA\nconsole.log(1);\n`).has('JSC-08'));
  assert.ok(lint(`${HEADER}// jsc-ignore JSC-08\nconsole.log(1);\n`).has('JSC-08'), 'suppression without reason must not count');
});

test('lint-os-js: specific rules', () => {
  assert.ok(lint(`${HEADER}eval(code);`).has('JSC-02'));
  assert.ok(lint(`${HEADER}setTimeout("go()", 10);`).has('JSC-02'));
  assert.ok(lint(`${HEADER}el.innerHTML = data;`).has('JSC-03'));
  assert.ok(!lint(`${HEADER}el.innerHTML = '';`).has('JSC-03'), 'literal innerHTML is fine');
  assert.ok(!lint(`${HEADER}window.ReqApp = window.ReqApp || {};`).has('JSC-04'), 'namespace pattern is allowed');
  assert.ok(lint(`${HEADER}window.chart = c;`).has('JSC-04'));
  assert.ok(!lint(`${HEADER}window.location = url;`).has('JSC-04'));
  assert.ok(lint(`${HEADER}x.then(() => 1);`).has('JSC-07'));
  assert.ok(!lint(`${HEADER}x.then(() => $resolve());`).has('JSC-07'));
  assert.ok(!lint(`${HEADER}$actions.Confirm('a');`).has('JSC-12'), '$actions.Confirm is not window.confirm');
  assert.ok(!lint(`${HEADER}const s = $parameters.X; $actions.Run();`).has('JSC-09'), '$parameters/$actions are not jQuery');
  assert.ok(lint(`${HEADER}btn.setAttribute('onclick', 'go()');`).has('JSC-11'));
  assert.ok(lint(`${HEADER}const k = { apiKey: 'abcd1234efgh' };`).has('JSC-13'));
  assert.ok(!lint(`${HEADER}const ns = 'http://www.w3.org/2000/svg';`).has('JSC-13'));
  assert.ok(lint('const a = 1;').has('JSC-15'));
});

test('stripComments keeps strings and line numbers', () => {
  const out = stripComments("a('//not a comment'); // gone\n/* x\n y */ b();");
  assert.ok(out.includes("'//not a comment'"));
  assert.ok(!out.includes('gone'));
  assert.equal(out.split('\n').length, 3);
});

test('check-names: good inventory is clean, bad one fails with expected IDs', () => {
  const good = run('check-names.mjs', ['scripts/examples/inventory/good-request-cw.json', '--json']);
  assert.equal(good.code, 0);
  assert.equal(good.json.findings.length, 0);
  const bad = run('check-names.mjs', ['scripts/examples/inventory/bad-request-portal.json', '--json']);
  assert.equal(bad.code, 1);
  for (const id of ['NAM-02', 'NAM-03', 'NAM-04', 'NAM-05', 'NAM-06', 'STR-02', 'STR-03', 'BLK-02', 'BLK-05', 'BLK-08', 'NAV-02', 'FET-04', 'STA-04', 'SEC-07', 'A11Y-08', 'FET-01', 'LCY-01', 'LCY-03', 'LCY-07', 'CLG-01', 'FSC-06', 'MOB-06']) {
    assert.ok(ids(bad).has(id), `missing ${id}`);
  }
});

test('check-names: style handling and ignores', () => {
  const inv = (names, extra = {}) => ({ modules: [{ name: 'M', uiFlows: [{ name: 'Requests', screens: names.map((n) => ({ name: n, title: 't', ...extra })) }] }] });
  const r1 = checkInventory(inv(['Request_List', 'Request_Detail']));
  assert.equal(r1.style, 'underscore');
  assert.equal(r1.findings.filter((f) => f.id === 'NAM-01').length, 0);
  const r2 = checkInventory(inv(['Request_List']), { style: 'pascal' });
  assert.ok(r2.findings.some((f) => f.id === 'NAM-01'));
  const r3 = checkInventory(inv(['Screen1'], { ignore: ['NAM-02: generated by a template, renamed in next sprint'] }));
  assert.ok(!r3.findings.some((f) => f.id === 'NAM-02'));
});

test('check-names: project handler and block styles', () => {
  const inv = { modules: [{ name: 'M', uiFlows: [{ name: 'Requests',
    screens: [{ name: 'RequestEdit', title: 't', actions: [{ name: 'SaveOnClick' }, { name: 'OnSave' }, { name: 'OnReady' }] }],
    blocks: [{ name: 'CustomerViewBlock' }, { name: 'CustomerCard' }] }] }] };
  const house = checkInventory(inv).findings;
  assert.ok(house.some((f) => f.id === 'NAM-04' && f.path.endsWith('OnSave')));
  assert.ok(!house.some((f) => f.path.endsWith('OnReady')), 'lifecycle handler names are fine');
  assert.ok(house.some((f) => f.id === 'NAM-03' && f.path.endsWith('CustomerViewBlock')));
  const syn = checkInventory(inv, { handlers: 'on-prefix', blockSuffix: true }).findings;
  assert.ok(syn.some((f) => f.id === 'NAM-04' && f.path.endsWith('SaveOnClick')));
  assert.ok(!syn.some((f) => f.path.endsWith('OnSave')));
  assert.ok(syn.some((f) => f.id === 'NAM-03' && f.path.endsWith('CustomerCard')));
  assert.equal(run('check-names.mjs', ['scripts/examples/inventory/good-request-cw.json', '--handlers', 'bogus']).code, 2);
});

test('usage errors exit 2', () => {
  assert.equal(run('lint-os-js.mjs').code, 2);
  assert.equal(run('check-names.mjs').code, 2);
  assert.equal(run('check-names.mjs', ['missing.json']).code, 2);
});
