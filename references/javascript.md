# JavaScript in OutSystems (Reactive Web, Mobile, ODC)

Rules: `JSC-*` in review-checklist.md; most are checked by `scripts/lint-os-js.mjs`. Inline JavaScript placement (`UI-07`) is in the architecture skill. Sources: the official pages *Defining asynchronous JavaScript code*, *Use JavaScript code from an external library*, *JavaScript API*, *Mobile best practices › JavaScript*, *Apply Content Security Policy*, and the TrueChange *JavaScript injection* and *performance* warnings.

## 1. When to write JavaScript
OutSystems generates optimized JavaScript, so every custom line needs a reason. In order, stop at the first that works:
1. An OutSystems UI pattern or widget property (including a **Style Classes expression** for dynamic styling).
2. A client action or built-in function (`SetFocus`, `ListSort`, `FormatDecimal`…).
3. An OutSystems UI client action (`SetAccessibilityRole`, `ScrollToElement`, `AddFavicon`…) or a maintained Forge component.
4. CSS, including animations (style guide).
5. A **JavaScript node** in a client action: small, documented, and wrapped in a reusable client action if used more than once.
6. A **Script element** (module, block or screen Required Script) for shared helpers or a third-party library, wrapped by client actions.

Never inline `<script>` in expressions or HTML widgets (`UI-07`).

## 2. The JavaScript node contract
```js
// Purpose: initialize the request chart on the container.
// In : $parameters.ContainerId (Text) — Widget.Id of the chart container
//      $parameters.DataJson   (Text)  — serialized data
// Out: $parameters.ChartRef   (Object)
// Async: no
const el = document.getElementById($parameters.ContainerId);
if (!el) { return; }                       // the widget may not be rendered (If branch)
$parameters.ChartRef = RequestCharts.create(el, JSON.parse($parameters.DataJson));
```
- **Header comment** with purpose, inputs, outputs, async (`JSC-15`). Template: `templates/js-node-template.js`.
- **Inputs and outputs through `$parameters`** only. Widget ids come in as `Widget.Id` (`JSC-01`): generated ids (`b3-Container2`) change on republish. During navigation **two screens' DOM coexist**, so a global `document.querySelector('.x')` may hit the old screen. Start from the widget you were given, or scope to `.active-screen`.
- **Guard for missing elements** (the widget may be inside an If that is false).
- **No globals** (`JSC-04`). Reactive and Mobile are single-page apps: `window` is never cleared between screens, so globals and their memory live until the tab closes. Keep instances in an **Object** local variable; a single namespace defined once in a Script element (`window.ReqApp = window.ReqApp || {}`) is acceptable.
- **Clean up** (`JSC-05`, `LCY-05`): every `addEventListener`, `setInterval`, observer or library instance created in OnReady is removed or destroyed in OnDestroy.
- Keep nodes short. A node with a lot of code (TrueChange: *"seems to include a JavaScript library"*) belongs in a **Script element** (`JSC-18`).

## 3. Asynchronous code (`JSC-07`, `JSC-16`)
Official behaviour:
- Using `$resolve()` or `$reject()` in a JavaScript node makes the **whole client action asynchronous**; the platform wraps the node in a promise for you. Don't create one yourself around the node's code.
- A client action that calls a server action or refreshes a data source is also asynchronous.
- **`$resolve()` takes no arguments.** Set outputs on `$parameters` first, then call `$resolve()`.
- `$reject(error)` raises an OutSystems exception, handled by the first matching Exception Handler (or the Global Exception Handler). An unhandled rejection shows the default error feedback message.
- Calling an **asynchronous** client action from JS returns a **promise**, not its outputs. Read the outputs inside `.then(result => …)`. A **synchronous** one returns a plain object.
- **Every promise chain has error handling**: `.catch(err => …)` or `.then(onOk, onError)`. Each path ends with `$resolve()` or `$reject(err)`.

```js
// Async: yes
$actions.GetUploadUrl($parameters.FileName)
  .then((result) => { $parameters.Url = result.Url; $resolve(); })
  .catch((err) => { $reject(err); });
```

## 4. Public API only (`JSC-17`)
Use only the documented objects: `$parameters`, `$actions`, `$roles`, `$resolve`/`$reject`, and the **`$public`** JavaScript API. Internal platform objects and modules (`OutSystems.Internal…`, `require('OutSystems/…')`, React internals, generated `model`/`controller` objects) are unsupported and break on upgrade.

| `$public` module/class | Use |
|---|---|
| `FeedbackMessage.showFeedbackMessage(msg, type)` / `closeFeedbackMessage()` | feedback from JS (0 Info, 1 Success, 2 Warning, 3 Error; HTML-encoded by default) |
| `Logger` | log like `console.log` **and** to Service Center: use it instead of console output (`JSC-08`) |
| `Security.checkIfCurrentUserHasRole($roles.X)` | **UI visibility only**, never a security decision (`FSC-01`) |
| `Validation` | set validation state on widgets inside lists/iterators |
| `Navigation`, `ApplicationContext`, `View`, `ApplicationLifecycle`, `Device` | navigation overrides, current screen/module info, view state, app load and upgrade events, native device access |

## 5. Security (`JSC-02`, `JSC-03`, `JSC-06`, `JSC-10`, `JSC-11`, `JSC-13`)
- No `eval`, `new Function`, or `setTimeout("string")`. Reactive apps can run with the CSP `unsafe-eval` and `unsafe-inline` directives **removed** (LifeTime / Service Center: untick *Enforce Unsafe Eval Reactive* and *Enforce Unsafe Inline Reactive*). Code that follows these rules keeps that option open.
- No `innerHTML`, `outerHTML`, `insertAdjacentHTML` or `document.write` with data. Use `textContent`, or OutSystems expressions (which encode by default). If HTML is unavoidable, encode with `EncodeHtml()` or sanitize with the Sanitization extension.
- Values from user input placed **inside JavaScript** built in expressions are wrapped in `EncodeJavaScript()` (TrueChange *JavaScript injection* warning); URLs built from input use `EncodeUrl()`.
- No tokens, passwords, roles or personal data in `localStorage` / `sessionStorage` / cookies set from JS. Client variables have the same exposure (`STA-04`).
- No secrets, API keys or internal URLs in JS (`JSC-13`): anything in JS is public. Calls that need a key go through a server action.
- Don't call REST endpoints directly with `fetch` from JS to bypass OutSystems logic; expose a server action, which carries authentication and authorization (`JSC-10`).
- No inline event-handler attributes (`onclick="…"`) and no `javascript:` URLs (`JSC-11`).

## 6. DOM and styling
- OutSystems renders with React: **avoid manipulating the DOM** (official). Moving, removing or re-creating elements the platform rendered leads to unpredictable results on the next render. Use If widgets, variables and lists.
- **Change styles through the widget's Style Classes property** with an expression (`"req-card" + If(IsSelected, " req-card--selected", "")`), not by adding or removing classes from JS (official: JS class changes reduce visibility and can flicker, `JSC-19`). JS class changes are acceptable only on DOM that a third-party component owns.
- Never set literal colors or sizes through `.style` (`JSC-14`; style guide `TOK-01`).
- **Animations in CSS** (GPU); if JS must animate, use `requestAnimationFrame`.
- Avoid properties that force layout (reflow) in loops (`offsetHeight`, `getBoundingClientRect` per row).
- Don't rely on OutSystems UI internal markup (deep class chains); it changes between versions (style guide `THM-04`).
- **No DOM-manipulating libraries such as jQuery** (official guidance for Reactive and Mobile). Exception: a corporate theme that already requires it, suppressed with that reason (`JSC-09`).

## 7. Libraries
- Prefer OutSystems UI and Forge components; external libraries can be too heavy for mobile devices.
- Load a library as a **Script element** and add it as a Required Script of the module, block or screen that needs it, not to every screen. Load order: **module → block → screen** scripts. Required scripts are evaluated in the **global scope**. Block and screen scripts load before that element renders; module scripts load before the app starts.
- Pin the version; record the source and license in the module Description or the project README.
- Wrap every library in **one CW block or client-action set** with a contract; screens never call the library directly.
- Prefer libraries that support scoping to an element and destroying instances.

## 8. Hygiene
- No `console.log`/`debugger` left in delivered code (`JSC-08`); use `$public.Logger` (also visible in Service Center) or a wrapped `LogClient` client action.
- No `alert()` / `confirm()` / `prompt()` (`JSC-12`); use the feedback helper and the Popup pattern.
- Repeated JS goes into **one client action** with a JavaScript node, called wherever needed; it is never copied between nodes (official).
- `const`/`let`, strict equality, early returns. Keep nodes under about 30 lines.
- Lint every node:
  ```
  node scripts/lint-os-js.mjs path/to/nodes/      # one .js file per node, copied from Service Studio
  node scripts/lint-os-js.mjs node.js --json
  ```
  Suppress a finding only with a reason on the same line or the line above: `// jsc-ignore JSC-09: corporate theme requires jQuery`.
