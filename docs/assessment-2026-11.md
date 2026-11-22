# Research and gap assessment: November 2026 (v1.0.0 → v1.1.0)

This records the research behind version 1.1.0: what was checked, what the sources say, how v1.0.0 compared, and what changed. Re-run this assessment after major OutSystems releases.

## 1. Sources

### Official (primary)
OutSystems publishes its product documentation as Markdown in the public repository **`OutSystems/docs-product`** (`src/…`), the source of success.outsystems.com. Pages read in full or skimmed:

| Topic | Path in `docs-product/src/` |
|---|---|
| Screen and block lifecycle events | `building-apps/ui/screens/screen-block-lifecycle-events.md` |
| Loading data on screens; rendering data | `building-apps/ui/screens/data-load.md`, `data-rendering.md` |
| Async fetching (master/detail) | `building-apps/data/operations/async-fetch-aggregates.md` |
| Front-end architecture best practices | `building-apps/ui/front-end/front-end-best-practices.md` |
| UI performance best practices | `building-apps/ui/best-practices-ui/best-practices-user-interface.md` |
| Block reuse and communication | `building-apps/ui/reuse/block-create-reuse.md`, `block-communicate.md`, `propagate-changes-from-a-reusable-screen-element.md` |
| Form validation | `building-apps/ui/forms/form-validate.md` |
| Passing data between screens | `building-apps/ui/navigation/pass-information-between-screens.md` |
| Exception handling mechanism | `building-apps/handling-exceptions/handling-mechanism.md` |
| Client variables shared between apps | `building-apps/data/share-client-var-between-app.md` |
| Server-to-client data transfer optimization | `building-apps/logic/client-data-transfer-optimization-tp.md` |
| Mobile best practices | `building-apps/mobile-best-practices/mobile-best-practices.md` |
| Offline sync checklist | `building-apps/data/offline/sync-checklist.md` |
| Asynchronous JavaScript; external libraries | `integration-with-systems/javascript/mobile/async.md`, `use-external-lib.md` |
| JavaScript API (`$public`), Role Check, FeedbackMessage | `ref/apis/javascript/intro.md`, `modules/rolecheck.md`, `modules/feedbackmessage.md` |
| TrueChange warnings: potential loop, performance, security, JavaScript injection | `ref/errors-and-warnings/warnings/*.md` |
| Reactive web security best practices (MVP article hosted in the docs) | `security/ext-rd-reactive-security-best-practices/…` |
| Content Security Policy; injection and XSS | `security/apply-content-security-policy.md`, `security/injection-XSS/…` |
| Performance top 10 | `app-architecture/performance-top-10-rules.md` |

### Community (secondary)
- OutSystems blog, *8 Best Practices for Building a Reactive Web App* (2021): menus loaded from the server with role checks and caching, server pagination, data passed into list-item blocks, OnParametersChanged, `GetUserId()` in aggregate filters.
- Synobsys public standards (synobsys.github.io): naming conventions (screens `<Entity>List/Edit/View`, screen actions `On<Action>`, reusable blocks suffixed `Block`, booleans `Is…`, ids `<Entity>Id`, `Const` prefix for constants, "do not name every container", modified-BEM CSS).
- OutSystems forum threads: lifecycle order questions, exceptions in blocks going to the wrong handler, no public exception handlers in Reactive, `$resolve` placement, Code Quality's "server request in client event" warning and the wrapper "workaround" that only hides it.
- Not readable by automated fetch (HTTP 403): itnext.io and medium.com articles (Reactive security, frontend architecture, promises, exception handling standards, the "10 rules of role-based access control"). Their search snippets agreed with the official guidance above; no claim in this skill depends on them.

### Companion skills checked for consistency
`outsystems-backend-conventions` (ActionResult contract, exception set, optimistic concurrency), `outsystems-bpt` and `outsystems-cmf` (task inbox and case UI cite FET/NAV/ERR/CLG IDs).

## 2. Findings vs v1.0.0

| # | Area | Finding (source) | v1.0.0 | Action in v1.1.0 |
|---|---|---|---|---|
| 1 | Lifecycle order | Block **OnReady/OnRender run before the parent's**; OnParametersChanged runs outer → nested; **OnDestroy runs top-down** (screen → outer → nested) (official) | Said "don't depend on the order" | Documented the official order; kept "don't build logic that depends on it" |
| 2 | Lifecycle, navigation | During navigation **both screens' DOM exist**; scope DOM work to `.active-screen` or a `Widget.Id` (official) | Not covered | Added to lifecycle and JavaScript; JS rule note |
| 3 | OnInitialize | Avoid **local storage** (`localStorage`/`sessionStorage`) and server calls; TrueChange warns; blocks may start rendering before an async OnInitialize ends; screens may redirect unauthorized users here (official) | Server calls only | Extended LCY-01; FET-01 covers local storage reads |
| 4 | OnRender | Official "prioritize content" pattern sets a flag in OnRender to render secondary blocks later | "Never assign" | LCY-03 now allows a **guarded one-time flag** |
| 5 | On After Fetch | Data is available but **not yet bound**; refreshing a source in **its own** On After Fetch is an infinite loop (TrueChange); server fetch chains should become **one data action** (official mobile BP) | Partly | New LCY-07; LCY-06 tightened |
| 6 | Data | **Server-to-client optimization** (PS 11.12+) sends only fields the client uses for screen aggregates, data actions and server actions in screen actions; `GetUserId()` **inside the aggregate** is the safe way to filter per user (official) | Not covered | Added to data and security |
| 7 | Lists | Mobile infinite scroll: **On Scroll Ending**, ~10 records, threshold 2000 px (`infinite-scroll-threshold`), keep list items simple, no expandable content in items, loading indicator at the end (official) | Pagination only | New FET-06 |
| 8 | Rendering | Set **image width and height**; prioritize main content; empty-state placeholders (official) | Partly | New FPF-04 |
| 9 | Forms | **Built-In Validations** property on the submitting event; module-level **Validation Messages**; `$public.Validation` for inputs inside lists (official) | Not covered | New VAL-07; forms section updated |
| 10 | Errors | **Global Exception Handler** module property (default `Common.OnException`); exceptions in a block are handled by the **consumer screen's** flow; **no public exception handlers** in Reactive, so every module needs its own; **OnApplicationReady** isn't covered; integrations raise generic errors → All Exceptions; `$reject()` raises an exception and unhandled rejections show the default error feedback (official + forum) | Partly | New ERR-06; ERR section rewritten |
| 11 | Errors × backend | Custom user-exception **types don't reliably cross Service Actions**; branch on `ActionResult.Code` (backend skill) | Recommended catching named user exceptions | ERR guidance now branches on codes |
| 12 | Result shape | Backend contract: `ActionResult {IsSuccess, Message, Code, Errors[{Field, Code, Message}]}`, data returned as separate outputs | `{IsSuccess, Id, Message, Errors[{Field, Message}]}` | Aligned (VAL-04) |
| 13 | Concurrency | Backend returns `CONCURRENT_UPDATE` when the `Version`/`UpdatedOn` sent by the client is stale | Not covered | New VAL-08 (send version back, handle conflict) |
| 14 | JavaScript async | `$resolve()` takes **no arguments**; calls to async client actions return a **promise** and **must have error handling** (`catch` or 2-arg `then`) (official) | Partly | New JSC-16; JSC-07 extended |
| 15 | JavaScript APIs | Use only the **public JS API** (`$public`, `$actions`, `$parameters`, `$roles`); internal APIs break on upgrade; `$public.Logger` logs to Service Center (official) | Not covered | New JSC-17; JSC-08 message |
| 16 | JavaScript DOM | Avoid DOM-manipulating libraries (jQuery) and DOM manipulation; **change styles through the widget's Style Classes expression**, not JS class toggles; animations in CSS / `requestAnimationFrame` (official) | Recommended JS class toggling | **Corrected**; new JSC-19 (Minor) |
| 17 | JavaScript size | A JS node with a lot of code triggers a TrueChange warning: put libraries in **Script** elements; required scripts load module → block → screen in global scope (official) | Partly | New JSC-18 |
| 18 | Injection | Expressions with user content inside JavaScript need `EncodeJavaScript()`; HTML needs `EncodeHtml()` / sanitization; Reactive apps can drop CSP `unsafe-eval` / `unsafe-inline` (official) | Partly | FSC-05 and JavaScript security extended |
| 19 | Security warnings | **Entity actions used from client logic** raise a security warning: wrap in a validating server action; every aggregate/server action used client-side is a **REST endpoint**; Anonymous screens (and blocks on them) expose public endpoints; test screens never leave Dev (official) | Partly | New FSC-06; security section extended |
| 20 | Mobile | Splash screens fetch nothing (TrueChange); plugin calls wrapped with **fallbacks** (`…_Safe`); lightweight local storage, sync in chunks (text first, images later); `TriggerOfflineDataSync`, not `OfflineDataSync`; client-side log for field issues (official) | Partly | New MOB-06, MOB-07; MOB section extended |
| 21 | Front-end patterns | No "objective" CSS classes (`.Bold`, `.Width20px`), no business logic in patterns, structure first (official front-end BP) | Style guide covers CSS | Cited in blocks section |
| 22 | Menus | Official blog loads the menu in OnInitialize; TrueChange/Code Quality warn against server calls there | — | Resolved: menu via a data source with server-side role filter + caching (FSC-07) |
| 23 | Naming (community) | Synobsys: screen actions `On<Action>`, blocks suffixed `Block`, screens `List/Edit/View` | House: `SaveOnClick`, no `Block` suffix | House style kept; Synobsys forms documented as an accepted **project** style (NAM-01) and supported by `check-names --handlers on-prefix` |
| 24 | Naming | Dates name what they mean (`SubmittedOn`, `DueDate`); `Const` prefix for constants; don't name every container | Partly | Added to naming |
| 25 | TrueChange | Most rules map to built-in warnings; teams should treat them as review input | Not mapped | New table in review-checklist.md |

## 3. Tool changes
- `lint-os-js.mjs`: JSC-16 (async call without error handling), JSC-17 (internal APIs), JSC-18 (large JS node), JSC-19 (class toggling where a Style Classes expression would do), `$resolve(arg)` detection, Logger hint.
- `check-names.mjs`: lifecycle wiring (server calls / local storage in OnInitialize, assignments in OnRender), entity actions called from client actions, several server calls in one action, splash screens with data sources, `--handlers on-prefix` for the Synobsys style.

## 4. Open items for the next review
- The exact rule names of the current **Code Quality / AI Mentor** catalog weren't published in a readable form; the mapping uses TrueChange warning texts. Re-check when OutSystems publishes the catalog in `docs-product`.
- ODC Studio warnings were not compared one by one with O11 TrueChange; the lifecycle and JS API are the same, but verify for ODC-only projects.
- Re-read the itnext/Medium sources by hand if they become reachable, and add anything new as lessons.
