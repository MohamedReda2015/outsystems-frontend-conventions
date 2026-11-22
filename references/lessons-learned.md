# Frontend lessons learned from real OutSystems projects

Collected from several enterprise and public-sector OutSystems 11 Reactive builds (request and file-exchange portals, executive 360° dashboards, case-management and benefits apps) and from building them through the Service Studio MCP / Model API. Names are generalized. Format: **problem → cause → rule**. FLL-20 onward come from the 2026 research (docs/assessment-2026-11.md). IDs (`FLL-xx`) can be cited in reviews. Visual lessons are in the style guide (`LES-*`); architecture lessons in the architecture skill's lessons-learned.

## Data and state
- **FLL-01: "No records" flashed on every load.**
  - *Cause*: the empty-state If checked `List.Empty` only, which is true before the fetch completes.
  - **Rule**: `IsDataFetched and List.Empty`; skeleton before that (`FET-03`).
- **FLL-02: A dashboard took 9 s to appear.**
  - *Cause*: six server actions called one after another in `OnInitialize` to "prepare" the KPIs; each waited for the previous one and the screen didn't render until all finished.
  - **Rule**: one data action per area, Fetch At Start, so they run in parallel; or one data action that returns all KPIs from one BL call (`FET-01`, `PERF-08`).
- **FLL-03: Child blocks in a list hammered the server.**
  - *Cause*: a `RequestCard` block with its own data action, rendered 25 times per page.
  - **Rule**: the parent fetches once and passes each card its data as parameters (`BLK-05`).
- **FLL-04: A block "didn't refresh" when the parent asked it to.**
  - *Cause*: `OnParametersChanged` fires only on a value change; the parent passed the same `RequestId` after a save.
  - **Rule**: add a `RefreshToken` input the parent increments, or let the block refresh itself after its own save and raise `OnSaved` (`BLK-04`).
- **FLL-05: The user's edits disappeared.**
  - *Cause*: the form's working copy was re-initialized in `On After Fetch` after a background refresh.
  - **Rule**: initialize the working copy only when `not HasChanges` (`STA-02`).

## Blocks and structure
- **FLL-06: Rebuilding a block broke every screen that used it.**
  - *Cause*: the block was deleted and recreated, so its key changed and consumers lost their references.
  - **Rule**: keep the block; clear and recreate its content (widgets, actions, data actions, local variables). The same applies to public actions (`BLK-06`).
- **FLL-07: Nobody could find anything in a 200-element module.**
  - *Cause*: flat lists and default names (`Action12`, `Block7`).
  - **Rule**: concept folders and UI flows first, specific names on creation (`STR-01`, `NAM-02`).
- **FLL-08: New blocks weren't visible to the Front-End.**
  - *Cause*: blocks are private by default; the consumer module couldn't reference them, and the producer wasn't republished before the dependency was added.
  - **Rule**: set Public deliberately, publish the producer, then add the dependency and refresh references in the consumer (`STR-03`).

## Platform and tooling
- **FLL-09: Translations couldn't be written through automation.**
  - *Cause*: the Model API exposes translations read-only.
  - **Rule**: create locales through the model, but do translations through Service Studio export/import; plan the time for it (`LOC-01`).
- **FLL-10: Client-side role checks didn't validate.**
  - *Cause*: a `CheckXRole()` call in a client expression was rejected; roles are a server concept.
  - **Rule**: return permission flags (`CanX`) from a server data action and use them for visibility only (`FSC-03`).
- **FLL-11: A fixed bug "came back" after republishing.**
  - *Cause*: the browser kept the old Reactive JavaScript in its cache.
  - **Rule**: after a publish, clear the cache (or hard reload) before verifying; tell testers to do the same (`VER-01`).
- **FLL-12: Edits in a huge front-end module timed out.**
  - *Cause*: very large modules (about 10 MB) take minutes to load through automation and can fail.
  - **Rule**: build new UI as blocks in a small CW module and drop them into the large screen by hand.
- **FLL-13: The corporate layout needed a script on every screen.**
  - *Cause*: the corporate theme's layout depends on a script (jQuery) that isn't added automatically.
  - **Rule**: inspect an existing app on the same theme first, and add its Required Scripts to every new screen (`JSC-09` is suppressed with that reason).

## Errors, forms and feedback
- **FLL-14: Users saw SQL errors.**
  - *Cause*: a catch-all handler displayed `AllExceptions.ExceptionMessage`.
  - **Rule**: generic message + log for unexpected errors; only User Exception messages are shown (`ERR-01`).
- **FLL-15: Requests were submitted twice.**
  - *Cause*: no busy guard; a slow server and an impatient double-click.
  - **Rule**: `IsSaving` guard + Button Loading + reset on every exit path (`CLG-03`); idempotency on the server for critical submits.
- **FLL-16: The session expired mid-form and the user got a blank error.**
  - *Cause*: the flow's OnException didn't handle `SecurityException`.
  - **Rule**: handle it explicitly: redirect to login with the return URL; for long forms, warn before timeout (`ERR-02`).
- **FLL-17: A client-only validation was bypassed.**
  - *Cause*: a "max 3 attachments" rule existed only in the client action.
  - **Rule**: every rule is re-checked in BL (`VAL-03`).

## From the 2026 research (official docs, forums, community standards)
- **FLL-20: A block's error went to an unexpected handler.**
  - *Cause*: exceptions raised in a block are handled by the OnException of the **consuming screen's** flow, and Reactive has no public exception handlers, so a CW module's own flow handler never ran in the Front-End app.
  - **Rule**: every Front-End module has its own flow handlers and Global Exception Handler; blocks catch what they must show inline (`ERR-06`).
- **FLL-21: The Code Quality warning went away, the slowness didn't.**
  - *Cause*: a team wrapped the server call in another client action so the analyzer stopped flagging "server request in client event"; the request still ran in OnReady.
  - **Rule**: fix the design (data source, one server call), not the detector (`FET-01`).
- **FLL-22: Styles applied from JavaScript flickered and were lost.**
  - *Cause*: classes added with `classList` were reset on the next React render.
  - **Rule**: dynamic styling goes in the widget's Style Classes expression (`JSC-19`).
- **FLL-23: An output read from `$actions` was undefined.**
  - *Cause*: the called client action was asynchronous (it had a server call), so it returned a promise; the code read the result synchronously and had no `catch`.
  - **Rule**: read outputs in `.then()`, always add `.catch()`, finish with `$resolve`/`$reject` (`JSC-16`).
- **FLL-24: Every screen waited for the menu.**
  - *Cause*: following an older blog tip, the menu was fetched from the server in the layout's OnInitialize, which blocks rendering on every navigation.
  - **Rule**: menu entries from a data source filtered by role on the server, cached; nothing in OnInitialize (`FSC-07`, `LCY-01`).
- **FLL-25: Two developers saved the same record; the second silently won.**
  - **Rule**: send the record version back and handle `CONCURRENT_UPDATE` in the form (`VAL-08`).

## Process
- **FLL-18: Mock data shipped to a demo as if real.**
  - **Rule**: while a data action returns sample data (a `*_Mock` BL action), the block shows a visible "Sample data" tag; remove it when connected (style guide `LES-11`).
- **FLL-19: "Done" from the model, broken in the browser.**
  - **Rule**: verify every screen in the running app: happy path, empty, error, double-click, back, deep link (`VER-01`).
