
| MOB-06 | Splash screens fetch no data and stay light; app-start data loads on the default screen | Major | names |
| MOB-07 | Plugin calls are wrapped with a fallback (error or mock) when the plugin is unavailable | Minor | model |
| FPF-04 | Main content renders first (secondary blocks behind a flag); Image widgets have width and height | Minor | browser, model |
| FPF-05 | Animations in CSS (or `requestAnimationFrame`), not JS timers | Minor | js, model |
| FSC-06 | No entity actions (Create/Update/Delete) called from client logic; use validating use-case server actions | Blocker | names, model |
| FSC-07 | Menu entries come from the server filtered by role; target screens have their own roles | Major | model |
| JSC-16 | Calls to asynchronous client actions or promises have error handling (`catch` or a 2-argument `then`) and end in `$resolve`/`$reject`; `$resolve()` takes no arguments | Major | js |
| JSC-17 | Only the public JavaScript API (`$public`, `$actions`, `$parameters`, `$roles`); no internal platform objects or modules | Major | js |
| JSC-18 | No large code or libraries inside JavaScript nodes; libraries are Script elements (Required Scripts) | Minor | js |
| JSC-19 | Widget styling changes through Style Classes expressions, not JS class toggling (except DOM owned by a third-party component) | Minor | js |
| ERR-06 | Every Front-End module sets its Global Exception Handler (Common › OnException) covering Security, Communication, User and All exceptions; OnApplicationReady handles its own errors | Major | model |
| VAL-07 | Submitting events have Built-In Validations = Yes and handlers check `Form.Valid`; default validation texts are set (and translated) once in the module's Validation Messages | Minor | model |
| VAL-08 | Edit forms send back the record `Version`/`UpdatedOn` and handle `CONCURRENT_UPDATE` without losing the user's input | Major | model, browser |
| FET-06 | Phone/mobile lists use On Scroll Ending (about 10 records per step), list items stay simple (no maps, charts, JS widgets or expandable content) and show a loading indicator at the end | Minor | model, browser |
| LCY-07 | No data source is refreshed in its own `On After Fetch` (infinite loop) | Blocker | model |# Frontend review checklist

Each rule has an ID, a severity and a way to check it.
- **Severity**:
  - **Blocker**: must be fixed before release (security holes, data loss, broken flows).
  - **Major**: fix in this iteration (wrong data behaviour, missing states, maintainability breaks).
  - **Minor**: fix when touching the area.
- **Check**:
  - `js` = `node scripts/lint-os-js.mjs` detects it;
  - `names` = `node scripts/check-names.mjs` detects it on an inventory;
  - `model` = inspect the module in Service Studio (or the MCP read tools);
  - `browser` = run the app and look (DevTools where useful).

Rules from the companion skills are cited by their own IDs (architecture: `HSE`, `UI`, `SEC`, `PERF`, `DAT`, `MNT`; style guide: `TOK`, `THM`, `LAY`, `A11Y`, `FDB`, `CMP`, `TXT`, `RSP`, `LES`) and are not repeated here.

## NAM: naming
| ID | Rule | Sev | Check |
|---|---|---|---|
| NAM-01 | One naming style per project (`ConceptThing` or `Concept_Thing`), English, PascalCase; recorded in AGENTS.md | Minor | names |
| NAM-02 | No default or noise names on referenced elements (`Screen1`, `Block2`, `Action1`, `Aggregate1`, `DataAction1`, `Input_Text2`, `Copy`, `Temp`, `New`, `Test`) | Major | names |
| NAM-03 | Screens `<Concept><Purpose>`; blocks `<Concept><Thing>`; popups end in `Popup` | Minor | names |
| NAM-04 | Handlers `<Trigger><Event>` (`SaveOnClick`); reusable client actions verb-first; data actions and aggregates `Get<What>` | Minor | names |
| NAM-05 | Block events start with `On` and name what happened (`OnSaved`, `OnSelected`) | Minor | names |
| NAM-06 | Booleans start with `Is`, `Has`, `Can`, `Show` (or `Should`); identifier parameters end in `Id`; lists are plural | Minor | names |
| NAM-07 | Widgets used by logic, JS, tests or CSS are named `<Meaning><WidgetType>` | Minor | model |

## STR: structure
| ID | Rule | Sev | Check |
|---|---|---|---|
| STR-01 | Screens and blocks grouped into UI flows by concept; client actions in folders by kind; no flat lists | Minor | model |
| STR-02 | Every UI flow has a purpose (concept or `Common`); no catch-all `MainFlow` with dozens of screens | Minor | names |
| STR-03 | Only intended elements are Public; every public block and client action has a Description and a documented contract | Major | names, model |

## BLK: blocks and screens
| ID | Rule | Sev | Check |
|---|---|---|---|
| BLK-01 | Blocks are self-contained: everything comes in through parameters; no hidden dependency on screen state or client variables | Major | model |
| BLK-02 | Blocks communicate outward only through events (with ids and small values as event parameters) | Major | model |
| BLK-03 | Blocks don't navigate to other modules' screens, refresh their parent or call parent logic | Major | model |
| BLK-04 | Blocks refresh their data in `OnParametersChanged`; forced reloads use a `RefreshToken` parameter | Major | model |
| BLK-05 | No data source inside a block that is repeated in a List; the parent fetches once and passes data | Major | model |
| BLK-06 | Public block contracts change compatibly (new parameters optional); rebuilds keep the element key | Major | model |
| BLK-07 | One responsibility per block (guideline: ≤ 3 data sources, ≤ 15 local variables, ≤ 10 screen actions) | Minor | names, model |
| BLK-08 | Screens carry no data sources or business logic of their own beyond composition (house architecture) | Major | names, model |
| BLK-09 | Popups are blocks with events; the parent owns visibility; popup data is fetched on demand | Minor | model |

## NAV: navigation
| ID | Rule | Sev | Check |
|---|---|---|---|
| NAV-01 | Internal navigation uses Destinations; no hand-built internal URLs; external URLs come from configuration | Major | model |
| NAV-02 | Screen input parameters are ids and simple filters; Mandatory only when required; never records | Major | names |
| NAV-03 | Lists keep filters, sort and page on Back | Minor | browser |
| NAV-04 | Long forms warn about unsaved changes before navigation | Minor | browser |
| NAV-05 | Deep links work: a detail screen opened by URL loads by id and handles not found / not allowed | Major | browser |

## LCY: lifecycle
| ID | Rule | Sev | Check |
|---|---|---|---|
| LCY-01 | `OnInitialize` only sets defaults: no server calls, no local-storage access, no DOM access | Major | model, names |
| LCY-02 | `OnReady` does run-once DOM work (init widgets, focus, listeners); no data fetching | Major | model |
| LCY-03 | `OnRender` is absent or justified; it never assigns screen/block data unconditionally (a guarded one-time flag is allowed) | Major | model, names |
| LCY-04 | `OnParametersChanged` refreshes and resets only; no navigation or server action calls | Major | model |
| LCY-05 | Everything started in `OnReady` (listeners, intervals, library instances) is cleaned up in `OnDestroy` | Major | model, js |
| LCY-06 | `On After Fetch` only shapes data; user-independent dependent server fetches are merged into one data action instead of After-Fetch chains | Major | model |

## FET: data fetching
| ID | Rule | Sev | Check |
|---|---|---|---|
| FET-01 | Data is read by aggregates and data actions, never by server actions called in client events | Blocker | model |
| FET-02 | Data not needed at first sight (tabs, popups, details, dependent data) uses Fetch = Only on demand | Minor | model |
| FET-03 | Every data area has loading, error, empty and populated states; empty is gated on `IsDataFetched` | Major | browser, model |
| FET-04 | Data actions: `Get<What>`, one BL call, only needed fields, no user id input | Major | names, model |
| FET-05 | Lists are paged, sorted and filtered on the server; no "load all rows" | Major | model, browser |

## STA: state
| ID | Rule | Sev | Check |
|---|---|---|---|
| STA-01 | Block input parameters are not assigned inside the block | Minor | model |
| STA-02 | One source of truth per value; a form working copy is initialized once (not while `HasChanges`) | Major | model |
| STA-03 | Derived values are expressions, not variables kept in sync by hand | Minor | model |
| STA-04 | Client variables hold only non-sensitive preferences: no tokens, roles, authorization flags or personal data | Blocker | names, model |
| STA-05 | Client variables are documented; user-specific ones are cleared on logout | Minor | model |

## CLG: client logic
| ID | Rule | Sev | Check |
|---|---|---|---|
| CLG-01 | One server call per user action | Major | model |
| CLG-02 | The client doesn't orchestrate multi-step business processes; that's one BL use-case action | Major | model |
| CLG-03 | Every user-triggered server call has a busy guard (`IsSaving`), Button Loading, and resets it on every exit path | Major | browser, model |
| CLG-04 | Reusable client logic lives in CW `UIHelpers`, not copied across screens | Minor | model |
| CLG-05 | Screen/client actions stay short (guideline ≤ 15 nodes, ≤ 3 nested Ifs) | Minor | model |
| CLG-06 | No business rule exists only on the client | Major | model |
| CLG-07 | Client and screen action flows are laid out and labelled: happy path straight down, If True down / False right, For Each cycle to the right, straight connectors (empty `Dummy` Assigns at corners), Ifs labelled as questions or Is/Has names, no default labels (`If1`, `Assign1`) | Minor | model |
| CLG-08 | Built-ins before loops before JavaScript: expressions and client List actions (`ListAny`, `ListFilter`, `ListIndexOf`, `ListSort`…) before a For Each; a loop only does work on items, never just searches or filters; `If()` in one Assign for two-value choices; a JS node only for what the platform can't do | Minor | model, js |

## VAL: forms and validation
| ID | Rule | Sev | Check |
|---|---|---|---|
| VAL-01 | Forms use the Form widget, Mandatory and typed inputs | Minor | model |
| VAL-02 | Cross-field rules in one `Validate<Form>` client action that sets `Valid` / `ValidationMessage`; focus goes to the first invalid field | Minor | model, browser |
| VAL-03 | The server re-validates every rule, including permissions and state transitions | Blocker | model |
| VAL-04 | Expected business outcomes return the shared `ActionResult` (`IsSuccess`, `Message`, `Code`, `Errors[Field, Code, Message]`); the UI branches on `Code` and maps `Errors` to inputs | Major | model |
| VAL-05 | Unexpected failures are exceptions, not `IsSuccess = False` with exception text | Major | model |
| VAL-06 | Forms bind to a working-copy Structure, not to entity records; server actions take use-case inputs | Major | model |

## ERR: errors and feedback
| ID | Rule | Sev | Check |
|---|---|---|---|
| ERR-01 | `AllExceptions.ExceptionMessage` is never shown to end users | Blocker | model |
| ERR-02 | Every UI flow has OnException handling Security, Communication, User and All exceptions | Major | model |
| ERR-03 | No silent exception swallowing in client actions; busy flags reset in handlers | Major | model |
| ERR-04 | Data areas that must survive failures expose a `FetchError` and an inline Retry | Minor | model, browser |
| ERR-05 | Feedback goes through one shared helper; success names the object | Minor | model |

## JSC: JavaScript
| ID | Rule | Sev | Check |
|---|---|---|---|
| JSC-01 | No hard-coded element ids or generated-id selectors; widget ids come in via `$parameters` | Major | js |
| JSC-02 | No `eval`, `new Function` or string timers | Blocker | js |
| JSC-03 | No `innerHTML` / `outerHTML` / `insertAdjacentHTML` / `document.write` with non-literal content | Blocker | js |
| JSC-04 | No globals (`window.x =`, undeclared assignments); instances live in Object variables or one namespace | Major | js |
| JSC-05 | Listeners, intervals and observers are removed in `OnDestroy` | Major | js |
| JSC-06 | No tokens, passwords, roles or personal data in `localStorage` / `sessionStorage` / `document.cookie` | Blocker | js |
| JSC-07 | Async JS nodes call `$resolve()` / `$reject()` on every path | Major | js |
| JSC-08 | No `console.log` / `debugger` left in delivered code | Minor | js |
| JSC-09 | No jQuery unless the theme already requires it (suppressed with that reason) | Minor | js |
| JSC-10 | No direct `fetch` / `XMLHttpRequest` to the app's own or external APIs; use server actions | Major | js |
| JSC-11 | No inline event-handler attributes or `javascript:` URLs (CSP-friendly) | Major | js |
| JSC-12 | No `alert()` / `confirm()` / `prompt()`; use the feedback helper and Popup | Minor | js |
| JSC-13 | No hard-coded URLs, keys or secrets in JS | Major | js |
| JSC-14 | No literal colors or sizes set through `.style`; toggle classes | Minor | js |
| JSC-15 | Every JS node has a header comment (purpose, inputs, outputs, async) | Minor | js |

## FSC: frontend security
| ID | Rule | Sev | Check |
|---|---|---|---|
| FSC-01 | Client-side checks only control visibility; every action is re-authorized on the server | Blocker | model |
| FSC-02 | Forbidden actions are hidden (`Visible = False` / If), not only disabled | Major | browser |
| FSC-03 | Permission flags (`CanX`) are computed on the server per user and record | Major | model |
| FSC-04 | Ownership/tenant filters are applied on the server, not passed from the client | Blocker | model |
| FSC-05 | `Escape Content = No` only on sanitized, trusted HTML | Blocker | model |

## FPF: frontend performance
| ID | Rule | Sev | Check |
|---|---|---|---|
| FPF-01 | Only visible data is fetched at start (guideline ≤ about 5 At-Start sources per screen) | Minor | browser, names |
| FPF-02 | No re-render storms: no OnRender assignments, no heavy functions in bound expressions | Major | model, browser |
| FPF-03 | Scripts and libraries are required only where used | Minor | model |

## MOB: Mobile and offline
| ID | Rule | Sev | Check |
|---|---|---|---|
| MOB-01 | Local storage entities are few, denormalized per use case, without unnecessary blobs | Major | model |
| MOB-02 | Offline-capable screens read local storage through local aggregates | Major | model |
| MOB-03 | Sync is asynchronous with sync units, handles errors, and the UI is network-aware | Major | model, browser |
| MOB-04 | No secrets in local storage; personal data encrypted at rest; cleared on logout | Blocker | model |
| MOB-05 | Plugins are wrapped and checked for availability before use | Minor | model |

## LOC: multilingual
| ID | Rule | Sev | Check |
|---|---|---|---|
| LOC-01 | All user-facing texts are translatable; no sentence concatenation | Minor | model |
| LOC-02 | Data labels (statuses, types) come translated from the server | Minor | model |
| LOC-03 | Dates, numbers and currency are formatted per locale through helpers | Minor | browser |

## VER: verification
| ID | Rule | Sev | Check |
|---|---|---|---|
| VER-01 | Verified in the running app after a cache-clearing reload: happy path, empty, error, double-click, Back, deep link, phone/desktop | Major | browser |
| VER-02 | Review report lists each finding with rule ID, element path, evidence and fix | Minor | model |

## TrueChange and Code Quality warnings → rules
Service Studio already flags many of these rules. Treat every warning as a finding to fix or justify (warnings must not grow, `MNT-08`). Texts abbreviated from the official warnings reference.

| Platform warning (abbreviated) | Rule |
|---|---|
| "Fetching data from the server in a splash screen may cause performance issues" | MOB-06 |
| "The Client Action calls several Server Actions… group them in a single Server Action" | CLG-01 |
| "Iterating a Server Action generates several requests… iterate inside another Server Action" | CLG-01, CLG-02 |
| "OnInitialize contains accesses to the local storage or server, which delays the render" | LCY-01, FET-01 |
| "JavaScript element seems to include a JavaScript library… add it as a Script element" | JSC-18 |
| "Image is bigger than 500 KB" | PERF-17 |
| "OnRender changes the Screen's/Block's data… infinite rendering loops" | LCY-03 |
| "Refreshing an Aggregate/Data Action in its own OnAfterFetch… infinite loop" | LCY-07 |
| "You're exposing a database operation in the client side" | FSC-06 |
| "You're exposing a generic Server Action for public access and without authentication" | SEC-07, SEC-08 |
| "Ensure the expression is protected by using EncodeJavaScript()" | FSC-05 |
| Code Quality: server requests in client events (On Initialize / Ready / Render / After Fetch) | FET-01, PERF-08 |
| Code Quality: inline JavaScript; CSS in screens; inline styles | UI-07, UI-04 |

Wrapping a server call in another client action only hides it from the analyzer: the request still runs in the client event (forum consensus). Fix the design, not the detector.


## Reliability and evidence (2026-11 review)

These manual checks complement, rather than extend the claimed coverage of, the static scripts. Details and acceptance cases: [verification and reliability](verification-and-reliability.md).

| ID | Severity | Rule |
|---|---|---|
| FRV-01 | Major | Protect query identity, stale async results and dirty state; do not mix mock and real dependent views. |
| FRV-02 | Major | Use action-specific permissions and immutable IDs for required fields and assignee options. |
| FRV-03 | Major | Handle stable result codes, conflicts and ambiguous command outcomes without duplicate retries. |
| FRV-04 | Major | Verify lifecycle cleanup and runtime negative paths in addition to static validation. |

## Cross-skill acceptance

| ID | Severity | Rule | Check |
|---|---|---|---|
| FRV-05 | Major | Include provider/subject identity in client state and prevent mixed or stale dependent data. | Manual; verification-and-reliability reference. |
| FRV-06 | Major | Verify action-specific field permissions and recovery across role, state, session and refresh transitions. | Manual; verify against the story acceptance cases. |
