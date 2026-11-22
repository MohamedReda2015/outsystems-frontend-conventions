---
name: outsystems-frontend-conventions
description: Build, refactor and review OutSystems Reactive and Mobile screens, blocks, data actions, forms, client state and JavaScript in O11 or ODC. Includes naming and JavaScript checks. Use for frontend behavior, lifecycle and integration contracts; use the style-guide skill for visual design and accessibility details.
license: MIT
metadata:
  version: 1.2.0
  updated: "2026-11-22"
  platform: OutSystems 11 (Reactive Web, Mobile; Traditional Web notes) and ODC
  agent-independent: "true"
  companion-skills: outsystems-architecture (modules, layers, server security); outsystems-backend-conventions (BL logic, ActionResult, exceptions); outsystems-live-style-guide (visual design, CSS, accessibility); outsystems-bpt and outsystems-cmf (process and case UIs)
  sources: official OutSystems docs (OutSystems/docs-product), TrueChange warnings, community standards; see docs/assessment-2026-11.md
---

# OutSystems Frontend Conventions

## Scope, evidence and consistency

- Run bundled scripts from the skill directory or use absolute paths; do not assume they exist in the application checkout.
- Establish O11/ODC, application type, installed component versions and the target environment from available evidence; ask only for information that changes the work.
- Separate **platform facts**, **house defaults**, **project decisions** and **observed lessons**. Project conventions choose among supported designs; they cannot change runtime behavior. The FE/CW/BL/CS chain is an O11 house pattern, not an ODC requirement.
- Preserve the user's requested scope and existing authorization. Continue routine reversible work; a skill does not authorize publishing, dependency changes or production operations beyond that scope. Do not introduce phase-by-phase approval unless the user or environment requires it.
- Prefer installed API signatures and version-matched official documentation. A repository development branch, community workaround or old project observation is evidence to investigate, not a release guarantee.
- Report evidence separately: **prepared → model validated → merged → published → runtime verified**. A static checker passing proves only its covered checks on the supplied inventory. Unknown, blocked and not tested remain explicit.
- Read [verification and reliability](references/verification-and-reliability.md) when changing data contracts, concurrent operations, runtime behavior or verification. It contains the concrete acceptance checks and sources for this skill.


This skill makes an agent write OutSystems frontend code the way a senior OutSystems tech lead expects to find it in review:
- **predictable names and folders**, so anyone can find anything;
- **blocks with explicit contracts** (parameters in, events out), screens that only compose;
- **lifecycle events used for what they are for**, with independent initial reads in data sources and explicit user-triggered commands;
- **every state handled**: loading, empty, error, saving, success;
- **forms validated twice** (client for UX, server for truth) with one documented result shape;
- **JavaScript as the exception**, scoped, cleaned up and lint-clean;
- **no trust in the client**: the browser is public code.

It works for any agent (Claude, Copilot, Cursor, Codex, Gemini, a custom LLM agent) and for humans. Everything is plain Markdown plus two zero-dependency Node.js scripts.

## Where this skill sits

| Question | Skill |
|---|---|
| Which module, which layer, who may reference whom, how data and server security work | **outsystems-architecture** |
| How it *looks*: tokens, theme, CSS, patterns, responsive, WCAG, RTL | **outsystems-live-style-guide** |
| How the server side is written: BL use cases, `ActionResult`, exceptions, transactions, integrations | **outsystems-backend-conventions** |
| Processes, task inboxes, case management | **outsystems-bpt**, **outsystems-cmf** |
| How the frontend is *written*: names, contracts, lifecycle, fetching, state, logic, forms, errors, JS | **this skill** |

When they overlap, the owner above wins. This skill cites their rule IDs (`HSE-03`, `PERF-08`, `TOK-01`, `A11Y-15`…) instead of restating them.

## Applying conventions

Use the project's documented architecture, naming and design choices where supported. Use this skill's house defaults when the project has no decision. Official documentation and installed contracts determine platform behavior; house preferences never override those facts. Record a consequential deviation and its reason. Escalate unresolved security, data-integrity or compatibility conflicts, not ordinary naming or layout choices.

## Step 0: establish context (before writing anything)
1. **Platform and app type**: O11 Reactive, O11 Mobile, O11 Traditional Web (legacy; only the naming, security and JS rules apply) or ODC.
2. **Module role** under the house chain *Front-End → CW → BL → CS* (`HSE-01`): screens only in Front-End; blocks and UI helpers in CW (`_CW` / `_MCW`); no UI in BL/CS.
3. **What exists**: the theme and layout, CW blocks, UIHelpers, the feedback helper, the result structure, naming style already used. **Reuse before creating.**
4. **The naming style in force**: `ConceptThing` (default) or `Concept_Thing`. One per project (`NAM-01`).
5. **OutSystems UI version**: ask the style-guide skill (Step 0 there) before any CSS.

## Core conventions (details in the references)

### 1. Names say what and which kind (`references/naming-and-structure.md`)
| Element | Pattern | Examples |
|---|---|---|
| Screen | `<Concept><Purpose>` | `RequestList`, `RequestDetail`, `RequestEdit`, `RequestDashboard` |
| Block | `<Concept><Thing>` | `RequestForm`, `RequestCard`, `RequestFilters`, `RequestTimeline`, `RequestRejectPopup` |
| Screen / block action (handler) | `<Trigger><Event>` | `SaveOnClick`, `SearchOnChange`, `FiltersOnApply`, `GetRequestsOnAfterFetch` |
| Reusable client action | `<Verb><Object>` | `ShowFeedback`, `FormatFileSize`, `ValidateRequestForm` |
| Data action | `Get<What>` | `GetRequestDetail`, `GetRequestsPage` |
| Aggregate | `Get<Entities>` | `GetRequests`, `GetRequestStatuses` |
| Block event | `On<Happened>` (past tense or intent) | `OnSaved`, `OnCancelled`, `OnSelected`, `OnFilterChanged` |
| Boolean variable / parameter | `Is…`, `Has…`, `Can…`, `Show…` | `IsSaving`, `HasChanges`, `CanApprove`, `ShowFilters` |
| Identifier parameter | `<Entity>Id` | `RequestId` |
| Named widget | `<Meaning><WidgetType>` | `RequestTitleInput`, `SaveButton`, `FiltersContainer` |
| Client variable | `<Area><Name>` | `RequestListPageSize`, `PreferredLanguage` |

English, PascalCase, no abbreviations except agreed acronyms, no `Screen1`, `Block2`, `Action1`, `Test`, `Copy`, `New`. Group by **concept** in folders and UI flows.

### 2. Screens compose, blocks own (`references/screens-and-blocks.md`)
- A screen = layout + CW blocks + parameters + event handlers + navigation. No business logic, no server calls of its own beyond what composition needs (`HSE-03`, `UI-01`).
- A block declares a **contract**: input parameters (mandatory where it can't work without them), events (out), placeholders (slots). Document it with `templates/block-contract.md`.
- A block **never** reads screen state, navigates to another module's screen, or reaches into a sibling block. It raises an event; the screen decides.
- Blocks refresh affected sources on `OnParametersChanged`; compare the record/query key, protect unsaved edits and reject stale custom async results. Do not recreate a block merely to refresh it.

### 3. Lifecycle: each event has one job (`references/lifecycle-and-events.md`)
| Event | Use it for | Never |
|---|---|---|
| `OnInitialize` | defaults from parameters; cheap, synchronous; a screen may redirect on a failed client-side guard | server calls, local storage, DOM access (it blocks the first render) |
| `OnReady` | run-once DOM work: init a third-party widget, `SetFocus`, add listeners | fetching data; assuming data has arrived |
| `OnRender` | rare: sync a widget to changed data; a guarded one-time flag to render secondary content | unconditional data changes (render loop), heavy work, server calls |
| `OnParametersChanged` (blocks) | `Refresh Data` on sources that depend on parameters; reset local state | navigation, server action calls |
| `OnDestroy` | remove listeners, clear intervals, destroy third-party instances | server requests (they delay leaving) |
| `On After Fetch` | shape fetched data (not yet bound to widgets) | server calls (`PERF-08`); refreshing its own source (loop, `LCY-07`); fetch chains (merge into one data action) |

Official order: blocks' OnReady/OnRender run before their parent's; OnDestroy runs top-down; during navigation **two screens' DOM coexist**. Don't build logic on that order: use events.

### 4. Data: fetched by data sources, in parallel, with states (`references/data-fetching-and-state.md`)
- Data comes from **aggregates and data actions** on the screen/block (Fetch = At Start, run in parallel), not from server actions called in client events (`PERF-08`, `FET-01`). In the house architecture CW blocks fetch through **data actions that call BL Service Actions** (`HSE-03`).
- Data not needed immediately (tabs, popups, details): **Fetch = Only on demand**, then `Refresh Data` when shown.
- Show the empty state **only when** `GetX.IsDataFetched and GetX.List.Empty`. Before that, a skeleton or spinner (`FET-03`, style guide `FDB-01`).
- Paginate on the server: Max. Records + `StartIndex` + count (`FET-05`); phone lists use On Scroll Ending, about 10 rows per step, simple items (`FET-06`).
- Per-user filtering uses `GetUserId()` **inside** the aggregate or data action, never a user id sent from the client (`SEC-09`).
- State lives in the smallest scope that works: local variable → block parameter → screen parameter (ids only) → client variable (non-sensitive preferences only) (`STA-*`).

### 5. One user action, one server call (`references/client-logic-forms-errors.md`)
- A button handler: guard (`IsSaving`), client validation, **one** server action (BL use-case), handle the result, give feedback, then refresh or navigate (`CLG-01`, `PERF-15`).
- Server actions called from the client take and return **Structures with only the needed fields**, never whole entity records (`SEC-11`, `DAT-04`).
- Every user-triggered server call has `IsSaving`/`IsBusy` handling: disable or show Button Loading, prevent double submit (`CLG-03`).

### 6. Forms: validate twice, answer in one shape
- Client: **Mandatory** + Input Type, **Built-In Validations = Yes** on the submit event, `Form.Valid`, plus a `Validate<Form>` client action for cross-field rules that sets `Input.Valid` / `Input.ValidationMessage` (`VAL-01`, `VAL-02`, `VAL-07`).
- Server: the BL action re-validates **everything** and returns the shared `ActionResult` (`IsSuccess`, `Message`, `Code`, `Errors[Field, Code, Message]`, same contract as outsystems-backend-conventions) for expected outcomes; exceptions only for unexpected failures (`VAL-03…05`).
- The UI **branches on `Code`** (not on message text or exception types), maps `Errors` onto inputs, and handles `CONCURRENT_UPDATE` without losing the user's input (`VAL-08`).

### 7. Errors and feedback: users get words, logs get details (`ERR-*`)
- Every UI flow has an **OnException** handler, and every Front-End module sets its **Global Exception Handler** (Common › OnException). Reactive has no public handlers, and a block's exceptions go to the **consuming screen's** flow (`ERR-02`, `ERR-06`).
- Handle `SecurityException` (session expired → login), `CommunicationException` (offline / timeout → retry message), User exceptions (show their translated message) and All exceptions (generic message + log). Never show `AllExceptions.ExceptionMessage` (`ERR-01`).
- Success: a transient Feedback Message. Destructive: confirm first, with the object named.

### 8. Navigation
- Navigate with **Destination** nodes to screens; never build internal URLs as strings. `RedirectToURL` only for external URLs from configuration (`NAV-01`).
- Screen input parameters are **ids and simple filters**, never records, never secrets (`SEC-13`).
- Lists keep their filter, sort and page when the user comes back (`NAV-03`).

### 9. JavaScript is the last resort (`references/javascript.md`)
- Use an OutSystems UI pattern, a client action or a Forge component first.
- JS nodes receive widget ids as `$parameters` (`Widget.Id`), never hard-code generated ids; only the public API (`$public`, `$actions`, `$parameters`, `$roles`); async code ends in `$resolve()` (no arguments) or `$reject()`, and every promise has a `catch`; listeners and intervals are removed in `OnDestroy`; no `eval`, no `innerHTML` with data, no secrets in `localStorage`, no globals, no jQuery.
- Styling changes go through the widget's **Style Classes expression**, not JS class toggling; animations in CSS (`JSC-19`, `FPF-05`). Libraries are **Script elements**, not code pasted into nodes (`JSC-18`).
- **Lint every JS node you write**:
  ```
  node scripts/lint-os-js.mjs <file-or-folder> [--json]
  ```

### 10. The browser is public (`references/security-performance-mobile.md`)
- Everything in a Reactive/Mobile client is readable and changeable by the user. Client-side permission checks (a `CanX` flag fetched from the server, or `$public.Security.checkIfCurrentUserHasRole` in JS) are **visibility only**; every server action, data action and aggregate rechecks on the server (`SEC-01`, `SEC-09`).
- Hide forbidden actions (`Visible = False`) rather than only disabling them, and still enforce on the server (`FSC-02`).
- Never pass the user id from the client; the server uses `GetUserId()` (`SEC-09`).
- Every client-used aggregate, data action and server action is a REST endpoint: no entity actions from client logic (`FSC-06`); Anonymous screens re-validate every input (`SEC-08`); menus come from the server filtered by role (`FSC-07`).
- **TrueChange warnings are findings**: the checklist maps each one to a rule. Fix the design, don't hide the call from the analyzer (FLL-21).

## How to work

### Building a screen or block
1. Do Step 0. Fill in `templates/block-contract.md` for every new block, and the style-guide skill's screen spec template for every new screen.
2. Create the **folders and UI flows first**, by concept (`STR-*`).
3. Build bottom-up: BL action exists → CW block with data action + contract → screen composes it.
4. Name every element as you create it (rules above). Rename defaults (`Action1`, `Container3`) only for elements referenced in logic, CSS or tests.
5. Wire states (loading, empty, error, saving), feedback and the exception handler before calling it done.
6. Lint JS (`scripts/lint-os-js.mjs`); lint CSS with the style-guide skill.
7. Clear every **TrueChange** warning or justify it in the review.
8. If you have a model inventory (JSON from the Service Studio MCP read tools or a hand list), run:
   ```
   node scripts/check-names.mjs <inventory.json> [--style underscore] [--handlers on-prefix] [--block-suffix] [--json]
   ```
9. **Verify in the running app** (`VER-01`): open the screen, do the happy path, the empty path, a server error, double-click Save, Back from detail, reload after resize. Report what you saw.

### Reviewing
1. Step 0, then run both scripts on what you can export.
2. Walk `references/review-checklist.md`; every rule has an ID and severity.
3. Write `templates/frontend-review-report.md`: most severe first, each with rule ID, evidence (element path) and a concrete fix.

### Refactoring an existing module
Read `references/lessons-learned.md` (FLL-*) first. Keep element keys when rebuilding blocks (clear and recreate content, don't delete the block) so consumers keep their references.

## Rules most often broken
- Server action called in `OnInitialize` / `OnReady` / `On After Fetch` (`FET-01`, `PERF-08`).
- Several server calls in one click handler (`CLG-01`, `PERF-15`).
- "No records" flashing before data arrives: missing `IsDataFetched` (`FET-03`).
- Whole entity records sent from the client to a server action (`SEC-11`).
- User id or role passed as a parameter (`SEC-09`).
- No double-submit guard on Save (`CLG-03`).
- `AllExceptions.ExceptionMessage` shown to users; no OnException handler in the flow (`ERR-01`, `ERR-02`).
- Blocks navigating to screens or reading screen variables (`BLK-03`).
- Hard-coded widget ids in JS; listeners never removed (`JSC-01`, `JSC-05`).
- Default names (`Action1`, `Block2`, `Screen3`) and flat folders (`NAM-02`, `STR-01`).
- Client variables holding tokens, roles or personal data (`STA-04`).
- Entity actions called from client actions (`FSC-06`); a data source refreshed in its own On After Fetch (`LCY-07`).
- Promise chains without `catch`, `$resolve(value)`, internal platform APIs (`JSC-16`, `JSC-17`).
- No Global Exception Handler in a Front-End module (`ERR-06`); concurrent edits overwritten silently (`VAL-08`).

## Reference map (read only what the task needs)
| File | Read when |
|---|---|
| `references/naming-and-structure.md` | naming any element; folders, UI flows, module tree |
| `references/screens-and-blocks.md` | designing a screen or block; parameters, events, placeholders, popups, reuse |
| `references/lifecycle-and-events.md` | any screen or block event; render loops; third-party widgets |
| `references/data-fetching-and-state.md` | aggregates, data actions, fetch modes, refresh, pagination, variables, client variables |
| `references/client-logic-forms-errors.md` | client and screen actions, forms, validation, result structure, exceptions, feedback, navigation |
| `references/javascript.md` | writing or reviewing a JavaScript node or script |
| `references/security-performance-mobile.md` | frontend security, performance budget, Mobile/offline, multilingual |
| `references/lessons-learned.md` | before any real build or refactor (FLL-01…) |
| `references/review-checklist.md` | any review, audit or "is this right?" question; maps TrueChange warnings to rules |
| `docs/assessment-2026-11.md` | the sources (official docs repo, community) and the gap assessment behind v1.1 |
| `templates/block-contract.md` · `templates/frontend-review-report.md` · `templates/js-node-template.js` | new block; review report; new JS node |
| `scripts/lint-os-js.mjs` | linting JavaScript nodes (`--json`) |
| `scripts/check-names.mjs` | checking a module inventory: names, parameters, roles, titles (`--style`, `--json`) |

For requirement-to-runtime handoffs, also use the cross-skill acceptance section in [verification and reliability](references/verification-and-reliability.md); preserve source/story/criterion IDs and the tested application version.
