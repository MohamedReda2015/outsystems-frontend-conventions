# Screen and block lifecycle (Reactive Web, Mobile, ODC)

Rules: `LCY-*` in review-checklist.md. The "no server calls in client events" rule is shared with the architecture skill (`PERF-08`, a Code Quality pattern) and is backed by TrueChange performance warnings. Source: the official *Screen and block lifecycle events* page (`docs-product/src/building-apps/ui/screens/screen-block-lifecycle-events.md`).

The **data of a screen or block** is: input parameters, variables, aggregates and data actions, and validation messages. Changing any of it re-renders and fires **OnRender**.

## 1. The sequence (official)
```
Navigate to screen
 ├─ role check (screen roles)
 ├─ OnInitialize            screen: before navigating and before any fetch · block: after navigation
 ├─ At-Start aggregates and data actions start concurrently (async)
 ├─ DOM of the new screen loads (the OLD screen's DOM is still there)
 ├─ OnReady                 blocks first, then their parent · once
 ├─ OnRender                blocks first, then their parent · after OnReady and after every data change
 ├─ transition; the old screen's OnDestroy runs, its DOM is removed
 └─ each fetch completes → On After Fetch (data available, NOT yet bound) → re-render → OnRender
Parent changes a block input → OnParametersChanged (outer block before nested) → OnRender
Leave → OnDestroy top-down: screen → outer block → nested blocks
```
Facts that drive the conventions:
1. **Data is asynchronous.** OnReady and the first OnRender run before data arrives. The first render always shows "no data yet": design for `IsDataFetched = False` (`FET-03`).
2. **OnInitialize blocks rendering.** Rendering starts only when it ends; server calls and local-storage access there delay the screen (TrueChange: *"contains accesses to the local storage or server, which delays the render"*).
3. **Two screens' DOM coexist** between the target's OnRender and the old screen's OnDestroy. DOM code must target the element it owns (a `Widget.Id`, or within `.active-screen`), never a global `document.querySelector` that could hit the old screen (`JSC-01`).
4. The order between parents and children is documented (above), but **don't build logic that depends on it**: if the parent needs something from a child, the child raises an event.

## 2. What each event is for

### OnInitialize (`LCY-01`)
- **Do**: set local variables from input parameters; cheap computed defaults (including a quick JS value such as a random id); set a child block's parameters from screen inputs; on a **screen**, redirect when a client-side guard fails (missing mandatory id → list screen). Real authorization stays on the server.
- **Don't**: server actions, `Refresh Data`, local storage reads/writes (`localStorage`, `sessionStorage`, Mobile local entities via actions), DOM access, JS that needs elements.
- In **blocks**, an OnInitialize with async work (server call, local storage) lets the render start before it finishes: variables it sets may render late or flicker.

### OnReady (`LCY-02`)
- **Do**: run-once DOM work: initialize a third-party component on `$parameters.WidgetId`; `SetFocus` on the first field; add listeners (removed in OnDestroy); start an interval (cleared in OnDestroy).
- **Don't**: fetch data; assume data has arrived (use On After Fetch for data-dependent logic); fix layout with JS that CSS should do.
- Mobile splash/first screen: if data must load at app start, fetch it on the **default screen** with a data source, never on the splash screen (`MOB-06`).

### OnRender (`LCY-03`)
- Fires after OnReady and after **every** data change, including those your own handlers cause.
- **Do**: sync an already-initialized third-party component with changed data (guarded: only if the input changed); the official **prioritize content** pattern: `If not ShowSecondary → ShowSecondary = True` so secondary blocks render after the main content (a guarded, one-time assignment).
- **Don't**: unconditional assignments (TrueChange *Potential loop* warning: infinite render loop); component initialization (that's OnReady); slow work or server requests.
- Most screens and blocks need **no** OnRender. One in review needs a reason.

### OnParametersChanged (blocks, `LCY-04`)
- Fires when the **parent** changes an input's value. Changes made **inside** the block don't fire it, and neither does the parent re-rendering with the same values.
- **Do**: `Refresh Data` on sources that depend on parameters; recalculate dependent variables; reset dependent state (selection, page index to 0).
- **Don't**: navigate; call server actions; raise events back to the parent on every change (feedback loops).
- Forcing a reload with identical parameters: a `RefreshToken` (Integer) input the parent increments.

### OnDestroy (`LCY-05`)
- **Do**: undo everything OnReady started: `removeEventListener`, `clearInterval`/`clearTimeout`, `chart.destroy()`, observer `disconnect()`.
- **Don't**: server requests (they delay leaving and the next screen); rely on the full DOM (two screens coexist).

### On After Fetch (`LCY-06`, `LCY-07`)
- The data is available but **not yet bound** to widgets.
- **Do**: shape data (pick the first row into a variable, compute a total); trigger a **user-independent** dependent source only when it can't be merged.
- **Don't**:
  - call a server action (`PERF-08`);
  - refresh the **same** source in its own On After Fetch (TrueChange: infinite loop, `LCY-07`);
  - chain server fetches (A's After Fetch refreshes B, B's refreshes C). Each link is a separate request in sequence. **Merge them into one data action** that runs the queries in order on the server (official mobile best practice, `PERF-13`).

## 3. Data source properties you should know
| Property | Meaning | Convention |
|---|---|---|
| `IsDataFetched` | the latest fetch completed | gate empty states and dependent UI on it; it stays False when a fetch fails without a handler |
| `FetchError` (house convention: a Text output on data actions) | the data action caught an error | show the error state with a Retry button (`ERR-04`) |
| `List.Empty` | no rows | prefer it over `List.Length = 0` / `Count` (`PERF-14`) |
| `Count` (aggregates) | total rows matching, ignoring Max. Records | pagination totals |
| Fetch: At start / Only on demand | when it runs | On demand for tabs, popups, details, anything after a user choice (`FET-02`) |

## 4. Third-party components (charts, maps, editors)
A wrapper block follows this skeleton:
```
Block ChartBar  (inputs: Data (list), Options, Height)  ·  local: ChartRef (Object)
OnReady             → JS InitChart($parameters.ContainerId, Data) → ChartRef
OnParametersChanged → JS UpdateChart(ChartRef, Data)
OnDestroy           → JS DestroyChart(ChartRef)
```
- The instance is stored in a local **Object** variable, never on `window` (`JSC-04`).
- Prefer OutSystems Charts, OutSystems UI patterns or a maintained Forge wrapper before writing one.
- Libraries load as **Script** elements (Required Scripts on the module, block or screen; load order module → block → screen; evaluated in global scope), not inside a JavaScript node and not by injecting `<script>` tags (`JSC-18`).
- Never put a heavy component (a map, a chart) **inside list items**: complexity multiplies per row (`FET-06`).

## 5. Timers and polling on the client
- Prefer server push or a manual Refresh button. If polling is required:
  - interval ≥ 30 s for dashboards, with backoff on errors;
  - pause when the tab is hidden (`document.visibilityState`);
  - clear it in OnDestroy (`LCY-05`);
  - each tick refreshes a data source; it never calls a chain of server actions.
