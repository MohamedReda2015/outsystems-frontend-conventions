#!/usr/bin/env node
// Checks an OutSystems frontend module inventory (JSON) against the naming, structure
// and contract rules of the outsystems-frontend-conventions skill. Zero dependencies (Node 18+).
//
//   node scripts/check-names.mjs <inventory.json> [--style pascal|underscore] [--json]
//
// The inventory is a plain JSON description of one or more modules (format in
// scripts/examples/inventory/README.md). Build it from the Service Studio MCP read tools
// (getScreen, getWebBlock, getDataModel…) or by hand. Elements can carry
// "ignore": ["NAM-02: reason"] to suppress a rule with a reason.
// Exit codes: 0 = no Blocker/Major findings, 1 = Blocker/Major found, 2 = usage error.
import { readFileSync, existsSync } from 'node:fs';

export const RULES = {
  'NAM-01': ['Minor', 'Naming style'],
  'NAM-02': ['Major', 'Default or noise name'],
  'NAM-03': ['Minor', 'Screen/block name pattern'],
  'NAM-04': ['Minor', 'Action / data source name pattern'],
  'NAM-05': ['Minor', 'Block event name'],
  'NAM-06': ['Minor', 'Boolean / identifier / list naming'],
  'STR-02': ['Minor', 'Catch-all UI flow'],
  'STR-03': ['Major', 'Public element without a Description'],
  'BLK-02': ['Major', 'Event carries a record'],
  'BLK-05': ['Major', 'Data source in a block repeated inside a List'],
  'BLK-07': ['Minor', 'Block does too much'],
  'BLK-08': ['Major', 'Front-End screen owns data sources'],
  'NAV-02': ['Major', 'Screen input parameter is not an id or simple value'],
  'FET-04': ['Major', 'Data action convention'],
  'STA-04': ['Blocker', 'Sensitive client variable'],
  'FPF-01': ['Minor', 'Too many At-Start data sources'],
  'LCY-01': ['Major', 'OnInitialize does slow work'],
  'LCY-03': ['Major', 'OnRender changes screen/block data'],
  'LCY-07': ['Blocker', 'Data source refreshed in its own On After Fetch'],
  'FET-01': ['Blocker', 'Server call in a client lifecycle event'],
  'CLG-01': ['Major', 'Several server calls in one client action'],
  'FSC-06': ['Blocker', 'Entity action called from client logic'],
  'MOB-06': ['Major', 'Splash screen fetches data'],
  'SEC-07': ['Major', 'Screen open to Anonymous/Registered (architecture skill)'],
  'A11Y-08': ['Major', 'Screen without a Title (style guide)'],
};

const DEFAULT_NAME = /^(?:Screen|Block|WebBlock|Webblock|Action|ClientAction|ServerAction|ScreenAction|Aggregate|DataAction|Container|Input_Text|Input_Password|Input|TextArea|Button|Link|Expression|Popup|Flow|UIFlow|MainFlow\d|LocalVariable|Variable|Var|Event|InputParameter|OutputParameter|Param|Structure|List|Form|Dropdown|Checkbox|Switch|Table|Icon|Image)_?\d+$/;
const NOISE = /(?:Copy\d*|Temp|Tmp|Old|Final|Test|Dummy|Xxx)$|^(?:Copy|Temp|Tmp|Test|My|Dummy)(?=[A-Z_]|$)/;
const TRAILING_NUMBER = /[a-z]\d+$/;
const PASCAL = /^[A-Z][A-Za-z0-9]*$/;
const UNDERSCORE = /^[A-Z][A-Za-z0-9]*(?:_[A-Z][A-Za-z0-9]*)+$/;
const BOOL_PREFIX = /^(?:Is|Has|Can|Show|Should)[A-Z]/;
const VERBS = new Set(('Show Hide Format Validate Map Get Set Build Calculate Compute Convert Open Close Toggle Init Initialize Load ' +
  'Refresh Reset Clear Confirm Navigate Go Check Parse Serialize Deserialize Add Remove Update Create Delete Save Submit Download ' +
  'Upload Copy Scroll Focus Register Unregister Destroy Sort Filter Generate Log Track Apply Select Ensure To Mask Trim Split Join ' +
  'Encode Decode Send Notify Print Export Import Start Stop Run Handle Prepare Find Search Compare Merge Is Has Can Request Resolve ' +
  'Append Insert Move Attach Detach Enable Disable Mark Change Fetch Read Write Render Display Count Sum Round Truncate Normalize Sanitize Escape').split(' '));
const SENSITIVE = /(?:token|passw|pwd|secret|role|jwt|auth|session|permission|isadmin|credential|nationalid|emiratesid|ssn|apikey)/i;
const BASIC_TYPES = /^(?:Text|Integer|Long Integer|LongInteger|Decimal|Boolean|Date|Time|Date Time|DateTime|Currency|Email|Phone Number|PhoneNumber)$/i;

const firstWord = (name) => (name.match(/^[A-Z][a-z0-9]*/) || [name])[0];
const isBoolean = (t) => /^boolean$/i.test(t || '');
const isIdentifier = (t) => /identifier$/i.test(t || '') && !/^list\b/i.test(t || '');
const isList = (t) => /^list\b|\blist$/i.test(t || '');

export function checkInventory(inv, opts = {}) {
  const findings = [];
  const add = (path, id, detail, el) => {
    if (el?.ignore?.some((s) => new RegExp(`^${id}\\s*:\\s*\\S`).test(s))) return;
    const [severity, title] = RULES[id];
    findings.push({ path, id, severity, message: `${title}: ${detail}` });
  };

  // Decide the style: explicit option, inventory field, or the majority of screens/blocks/client actions.
  const topNames = [];
  for (const m of inv.modules || []) {
    for (const f of m.uiFlows || []) for (const x of [...(f.screens || []), ...(f.blocks || [])]) topNames.push(x.name);
    for (const a of m.clientActions || []) topNames.push(a.name);
  }
  let style = opts.style || inv.style;
  if (style === 'ConceptThing') style = 'pascal';
  if (style === 'Concept_Thing') style = 'underscore';
  if (!style) {
    const u = topNames.filter((n) => UNDERSCORE.test(n)).length;
    style = u > topNames.length / 2 ? 'underscore' : 'pascal';
  }
  const styleOk = (n) => (style === 'underscore' ? UNDERSCORE.test(n) || PASCAL.test(n) : PASCAL.test(n));

  const checkName = (path, name, el, { top = false } = {}) => {
    if (!name) return;
    if (DEFAULT_NAME.test(name)) add(path, 'NAM-02', `"${name}" is a default name`, el);
    else if (NOISE.test(name)) add(path, 'NAM-02', `"${name}" contains a noise word`, el);
    else if (TRAILING_NUMBER.test(name) && !/(?:V\d+|[A-Z]\d+)$/.test(name)) add(path, 'NAM-02', `"${name}" ends with a number`, el);
    if (top ? !styleOk(name) : !PASCAL.test(name)) {
      add(path, 'NAM-01', `"${name}" is not ${top && style === 'underscore' ? 'Concept_Thing' : 'PascalCase'}`, el);
    }
  };

  const checkVars = (path, vars, kind) => {
    for (const v of vars || []) {
      const p = `${path} › ${kind} ${v.name}`;
      checkName(p, v.name, v);
      if (isBoolean(v.type) && !BOOL_PREFIX.test(v.name)) add(p, 'NAM-06', `Boolean "${v.name}" should start with Is/Has/Can/Show/Should`, v);
      if (isIdentifier(v.type) && !/Id$/.test(v.name)) add(p, 'NAM-06', `identifier "${v.name}" should end in Id`, v);
      if (isList(v.type) && !/(?:s|List|Ids)$/.test(v.name)) add(p, 'NAM-06', `list "${v.name}" should be plural`, v);
    }
  };

  const checkDataSources = (path, sources) => {
    for (const d of sources || []) {
      const p = `${path} › ${d.kind || 'dataSource'} ${d.name}`;
      checkName(p, d.name, d);
      if (!/^Get[A-Z]/.test(d.name)) add(p, 'NAM-04', `data source "${d.name}" should be Get<What>`, d);
      if (d.kind === 'dataAction') {
        for (const i of d.inputs || []) {
          if (/^(?:Current)?UserId$|^User$/i.test(i.name || i)) add(p, 'FET-04', `input "${i.name || i}" passes the user from the client (SEC-09)`, d);
        }
      }
    }
  };

  const LIFECYCLE = /^(?:OnInitialize|OnReady|OnRender|OnDestroy|OnParametersChanged)$/;
  const checkActions = (path, actions) => {
    for (const a of actions || []) {
      const ap = `${path} › action ${a.name}`;
      checkName(ap, a.name, a);
      // Handler naming: house <Trigger><Event> (SaveOnClick) vs Synobsys On<Action> (OnSave)
      if (opts.handlers === 'on-prefix') {
        if (/^[A-Z][A-Za-z0-9]*On[A-Z][A-Za-z0-9]*$/.test(a.name) && !/^On/.test(a.name)) {
          add(ap, 'NAM-04', `"${a.name}": this project uses On<Action> handlers (e.g. OnSave)`, a);
        }
      } else if (/^On[A-Z]/.test(a.name) && !LIFECYCLE.test(a.name) && !/OnAfterFetch$/.test(a.name)) {
        add(ap, 'NAM-04', `"${a.name}": house handlers are <Trigger><Event> (e.g. SaveOnClick); use --handlers on-prefix if the project chose On<Action>`, a);
      }
      const calls = a.serverCalls || [];
      if (calls.length > 1) add(ap, 'CLG-01', `${calls.length} server calls (${calls.join(', ')}); make one use-case server action`, a);
      if ((a.entityActions || []).length) add(ap, 'FSC-06', `calls ${a.entityActions.join(', ')} from the client; use a validating server action`, a);
    }
  };

  // Lifecycle wiring: element.lifecycle = { OnInitialize: "ActionName", ... }, dataSources[].onAfterFetch = "ActionName"
  const checkLifecycle = (path, el) => {
    const byName = new Map((el.actions || []).map((a) => [a.name, a]));
    for (const [event, actionName] of Object.entries(el.lifecycle || {})) {
      const a = byName.get(actionName);
      if (!a) continue;
      const ap = `${path} › ${event} (${actionName})`;
      const calls = a.serverCalls || [];
      if (calls.length && event !== 'OnDestroy') add(ap, 'FET-01', `calls ${calls.join(', ')} in ${event}; use aggregates or data actions`, a);
      if (event === 'OnDestroy' && calls.length) add(ap, 'FET-01', `server request in OnDestroy delays leaving the screen`, a);
      if (event === 'OnInitialize' && a.localStorage) add(ap, 'LCY-01', 'reads or writes local storage in OnInitialize; it delays the render', a);
      if (event === 'OnRender' && a.assignsData && !a.guarded) add(ap, 'LCY-03', 'assigns screen/block data unconditionally (render loop)', a);
    }
    for (const d of el.dataSources || []) {
      const a = d.onAfterFetch && byName.get(d.onAfterFetch);
      if (!a) continue;
      const ap = `${path} › ${d.name} On After Fetch (${a.name})`;
      if ((a.refreshes || []).includes(d.name)) add(ap, 'LCY-07', `refreshes ${d.name} inside its own On After Fetch (infinite loop)`, a);
      if ((a.serverCalls || []).length) add(ap, 'FET-01', `calls ${a.serverCalls.join(', ')} in On After Fetch`, a);
    }
  };

  for (const m of inv.modules || []) {
    const layer = (m.layer || '').toLowerCase().replace(/[^a-z]/g, '');
    const isFrontEnd = ['frontend', 'enduser', 'fe'].includes(layer);

    for (const f of m.uiFlows || []) {
      const fp = `${m.name} › ${f.name}`;
      checkName(fp, f.name, f);
      if (/^MainFlow$/i.test(f.name) && (f.screens || []).length > 10) {
        add(fp, 'STR-02', `"${f.name}" holds ${(f.screens || []).length} screens; split it by concept`, f);
      }

      for (const s of f.screens || []) {
        const sp = `${fp} › ${s.name}`;
        checkName(sp, s.name, s, { top: true });
        if (/(?:Screen|Page)$/.test(s.name)) add(sp, 'NAM-03', `"${s.name}" shouldn't end in Screen/Page`, s);
        if (/Popup/.test(s.name) && !/Popup$/.test(s.name)) add(sp, 'NAM-03', `popup "${s.name}" should end in Popup`, s);
        if (!s.title && !s.isPopup) add(sp, 'A11Y-08', 'no Title set', s);
        const open = (s.roles || []).filter((r) => /^(?:anonymous|registered)$/i.test(r));
        if (open.length && !s.publicIntended) add(sp, 'SEC-07', `roles include ${open.join(', ')}; set "publicIntended": true if deliberate`, s);
        for (const p of s.inputParameters || []) {
          const pp = `${sp} › input ${p.name}`;
          if (p.type && !BASIC_TYPES.test(p.type) && !isIdentifier(p.type)) {
            add(pp, 'NAV-02', `type "${p.type}" is not an id or a basic type`, p);
          }
          if (SENSITIVE.test(p.name)) add(pp, 'NAV-02', `"${p.name}" looks sensitive; it would appear in the URL (SEC-13)`, p);
        }
        checkVars(sp, s.inputParameters, 'input');
        checkVars(sp, s.localVariables, 'local');
        checkDataSources(sp, s.dataSources);
        checkActions(sp, s.actions);
        checkLifecycle(sp, s);
        const ds = s.dataSources || [];
        if (s.isSplash && ds.length) add(sp, 'MOB-06', `splash screen has ${ds.length} data source(s); fetch on the default screen`, s);
        if (isFrontEnd && (ds.some((d) => d.kind === 'aggregate') || ds.length > 1)) {
          add(sp, 'BLK-08', `${ds.length} data source(s) on a Front-End screen; move data into CW blocks`, s);
        }
        const atStart = ds.filter((d) => (d.fetch || 'AtStart') === 'AtStart').length;
        if (atStart > 5) add(sp, 'FPF-01', `${atStart} At-Start data sources`, s);
      }

      for (const b of f.blocks || []) {
        const bp = `${fp} › ${b.name}`;
        checkName(bp, b.name, b, { top: true });
        if (opts.blockSuffix) {
          if (!/Block$/.test(b.name) && !/Popup$/.test(b.name)) add(bp, 'NAM-03', `"${b.name}": this project suffixes reusable blocks with Block`, b);
        } else if (/(?:Block|WebBlock)$/.test(b.name)) add(bp, 'NAM-03', `"${b.name}" shouldn't end in Block (use --block-suffix if the project chose that style)`, b);
        if (/Popup/.test(b.name) && !/Popup$/.test(b.name)) add(bp, 'NAM-03', `popup "${b.name}" should end in Popup`, b);
        if (b.public && !(b.description || '').trim()) add(bp, 'STR-03', 'public block has no Description', b);
        for (const e of b.events || []) {
          const ep = `${bp} › event ${e.name}`;
          if (!/^On[A-Z]/.test(e.name)) add(ep, 'NAM-05', `"${e.name}" should start with On`, e);
          checkName(ep, e.name, e);
          for (const p of e.parameters || []) {
            if (p.type && !BASIC_TYPES.test(p.type) && !isIdentifier(p.type)) {
              add(ep, 'BLK-02', `event parameter "${p.name}" (${p.type}) should be an id or small value`, e);
            }
          }
        }
        checkVars(bp, b.inputParameters, 'input');
        checkVars(bp, b.localVariables, 'local');
        checkDataSources(bp, b.dataSources);
        checkActions(bp, b.actions);
        checkLifecycle(bp, b);
        const nDs = (b.dataSources || []).length;
        if (b.insideList && nDs > 0) add(bp, 'BLK-05', `rendered inside a List with ${nDs} data source(s)`, b);
        const sizes = [];
        if (nDs > 3) sizes.push(`${nDs} data sources`);
        if ((b.localVariables || []).length > 15) sizes.push(`${b.localVariables.length} local variables`);
        if ((b.actions || []).length > 10) sizes.push(`${b.actions.length} actions`);
        if (sizes.length) add(bp, 'BLK-07', `${sizes.join(', ')}; split it`, b);
      }
    }

    for (const a of m.clientActions || []) {
      const ap = `${m.name} › client action ${a.name}`;
      checkName(ap, a.name, a, { top: true });
      const verb = firstWord(a.name.split('_').pop());
      if (!VERBS.has(verb)) add(ap, 'NAM-04', `"${a.name}" should start with a verb (Show, Format, Validate…)`, a);
      if (a.public && !(a.description || '').trim()) add(ap, 'STR-03', 'public client action has no Description', a);
    }

    for (const v of m.clientVariables || []) {
      const vp = `${m.name} › client variable ${v.name}`;
      checkName(vp, v.name, v);
      if (SENSITIVE.test(v.name)) add(vp, 'STA-04', `"${v.name}" looks like a token, role or personal data; client variables are readable and editable by the user`, v);
    }
  }

  const order = { Blocker: 0, Major: 1, Minor: 2 };
  return { style, findings: findings.sort((a, b) => order[a.severity] - order[b.severity] || a.path.localeCompare(b.path)) };
}

function main(argv) {
  const json = argv.includes('--json');
  const si = argv.indexOf('--style');
  const style = si >= 0 ? argv[si + 1] : undefined;
  if (style && !['pascal', 'underscore'].includes(style)) { console.error('--style must be pascal or underscore'); return 2; }
  const hi = argv.indexOf('--handlers');
  const handlers = hi >= 0 ? argv[hi + 1] : undefined;
  if (handlers && !['trigger-event', 'on-prefix'].includes(handlers)) { console.error('--handlers must be trigger-event or on-prefix'); return 2; }
  const blockSuffix = argv.includes('--block-suffix');
  const file = argv.find((a, i) => !a.startsWith('--') && !['--style', '--handlers'].includes(argv[i - 1]));
  if (!file) { console.error('Usage: node scripts/check-names.mjs <inventory.json> [--style pascal|underscore] [--handlers trigger-event|on-prefix] [--block-suffix] [--json]'); return 2; }
  if (!existsSync(file)) { console.error(`Not found: ${file}`); return 2; }
  let inv;
  try { inv = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { console.error(`Invalid JSON: ${e.message}`); return 2; }
  const { style: used, findings } = checkInventory(inv, { style, handlers: handlers || inv.handlers, blockSuffix: blockSuffix || inv.blockSuffix });
  const count = (s) => findings.filter((f) => f.severity === s).length;
  const summary = { style: used, blocker: count('Blocker'), major: count('Major'), minor: count('Minor') };
  if (json) console.log(JSON.stringify({ summary, findings }, null, 2));
  else {
    for (const f of findings) console.log(`${f.severity.padEnd(7)}  ${f.id.padEnd(7)}  ${f.path}\n         ${f.message}`);
    console.log(`\nStyle: ${used}. ${summary.blocker} Blocker, ${summary.major} Major, ${summary.minor} Minor`);
  }
  return summary.blocker + summary.major > 0 ? 1 : 0;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('check-names.mjs')) process.exitCode = main(process.argv.slice(2));
