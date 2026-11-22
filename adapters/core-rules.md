# OutSystems Frontend Conventions: core rules (compact, for any agent)

You are building, refactoring or reviewing OutSystems frontend code (O11 Reactive Web or Mobile, or ODC): screens, blocks, client and screen actions, data actions, aggregates, forms, popups, JavaScript nodes. The full skill is the `outsystems-frontend-conventions/` folder:
- `SKILL.md` is the entry point;
- the `references/` files hold the details; read the relevant one before acting;
- these core rules always apply.

**Companions**: layers and server security → `outsystems-architecture`; BL logic, `ActionResult`, exceptions → `outsystems-backend-conventions`; look, tokens, CSS, accessibility → `outsystems-live-style-guide`; processes and case UIs → `outsystems-bpt`, `outsystems-cmf`. When they overlap, they win. Official docs and TrueChange warnings outrank old blog tips. Project conventions choose supported designs; this standard supplies defaults. Installed contracts determine runtime behavior; flag unresolved security or correctness conflicts.

**Step 0**: platform and app type; the module's layer (Front-End → CW → BL → CS); what already exists (theme, layout, CW blocks, UIHelpers, feedback helper, `ActionResult` structure); the naming style in force (`ConceptThing` default or `Concept_Thing`). Reuse before creating.

**Names**: English PascalCase; screens `<Concept><Purpose>` (`RequestList`, `RequestDetail`); blocks `<Concept><Thing>` (`RequestFilters`, `RequestRejectPopup`); handlers `<Trigger><Event>` (`SaveOnClick`); reusable client actions verb-first; data sources `Get<What>`; block events `On<Happened>` (`OnSaved`); booleans `Is/Has/Can/Show`; ids end in `Id`. Never `Screen1`, `Action1`, `Aggregate1`, `Copy`, `Temp`. Concept UI flows and kind folders, never flat lists.

**Screens compose, blocks own**: screens = layout + CW blocks + parameters + handlers + navigation. Blocks have a contract (parameters in, events out, placeholders), are self-contained, never navigate or read screen state, refresh in `OnParametersChanged` (`RefreshToken` to force), and never fetch per list item.

**Lifecycle**: `OnInitialize` = defaults only (no server, no local storage, no DOM); `OnReady` = run-once DOM work (init, focus, listeners); `OnRender` = rare, never unconditional data changes (a guarded one-time flag is fine); `OnParametersChanged` = refresh and reset; `OnDestroy` = undo everything `OnReady` started; `On After Fetch` = shape data (never refresh its own source; merge fetch chains into one data action). **No server calls in any client event.** Blocks' OnReady/OnRender run before the parent's, OnDestroy top-down, and two screens' DOM coexist during navigation: target your own widget.

**Data**: aggregates and data actions (Fetch At Start, parallel; Only on demand for tabs, popups, details). In CW, data actions call one BL Service Action and return only needed fields. Every data area: loading → error (Retry) → empty (only when `IsDataFetched`) → content. Server paging; phone lists use On Scroll Ending with simple items. Per-user filters use `GetUserId()` inside the server query. State in the smallest scope; client variables (local storage, shared across apps) only for non-sensitive preferences.

**User actions**: busy guard (`IsSaving`, Button Loading, reset on every path) → client validation → **one** server use-case action with a Structure input (never a whole entity record, never an entity action, never the user id) → `ActionResult` (`IsSuccess`, `Message`, `Code`, `Errors[Field, Code, Message]`) → branch on `Code`, map `Errors` to inputs, handle `CONCURRENT_UPDATE` → feedback → refresh or navigate. Submit events have Built-In Validations = Yes. The server re-validates everything. Flows: happy path straight down, If True down / False right, For Each cycle right, labelled nodes (no `If1`); expressions and List actions before loops, a loop only does work.

**Errors**: every UI flow has OnException, and every Front-End module sets its Global Exception Handler (Reactive has no public handlers; block exceptions go to the consuming screen's flow): Security (→ login/permissions), Communication (→ offline message), User (→ show message), All (→ generic message + log). Never show `AllExceptions.ExceptionMessage` to users. No silent swallowing.

**Navigation**: Destinations, not URL strings; input parameters are ids and simple filters; Back keeps list state; deep links work.

**JavaScript last**: pattern → client action → OSUI action/Forge → CSS → small JS node → Script element for libraries. Header comment; ids via `$parameters` (`Widget.Id`); public API only (`$public`, `$actions`, `$parameters`, `$roles`); `$resolve()` (no arguments) / `$reject()` and a `catch` on every promise; styling via Style Classes expressions, not JS class toggles; no globals, `eval`, `innerHTML` with data, `fetch`, secrets, `alert`, jQuery (unless the theme needs it); clean up in `OnDestroy`.

**Security**: the browser is public; every client-used aggregate, data action and server action is a REST endpoint. Client checks only hide; `Visible = False`, not just disabled; permission flags (`CanX`) come from the server per record; ownership filters applied on the server; menus filtered by role on the server; Anonymous screens re-validate every input.

**Verify**:
- `node outsystems-frontend-conventions/scripts/lint-os-js.mjs <js files or folder>` (lint a block's OnReady and OnDestroy nodes together; exit 1 = Blocker or Major);
- `node outsystems-frontend-conventions/scripts/check-names.mjs <inventory.json>`;
- clear or justify every TrueChange warning;
- run the app after a cache-clearing reload: happy path, empty, error, double-click Save, Back, deep link, phone and desktop. Report only what you saw.

**Reviews**: cite rule IDs from `references/review-checklist.md` (NAM, STR, BLK, NAV, LCY, FET, STA, CLG, VAL, ERR, JSC, FSC, FPF, MOB, LOC, VER, FLL) and use `templates/frontend-review-report.md`.
- Use `references/verification-and-reliability.md` for evidence and domain acceptance checks. Distinguish prepared, validated, merged, published and runtime verified; preserve task scope and existing authorization.
