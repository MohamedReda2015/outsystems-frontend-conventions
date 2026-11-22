# Frontend security, performance, Mobile and multilingual

Rules: `FSC-*` (frontend security), `FPF-*` (frontend performance), `MOB-*` (Mobile/offline), `LOC-*` (multilingual). Server-side security (`SEC-*`) and server performance (`PERF-*`) are owned by the architecture skill; this file covers what the frontend developer must do.

## 1. Frontend security: the browser is public (`FSC-*`)
In Reactive and Mobile, screens, client actions, client variables and JS are delivered to the device. Anyone can read them, call the server endpoints they use with other values, and change local state.

- **Visibility is not authorization** (`FSC-01`): hiding a button by role or by a `CanApprove` flag is UX. The server action re-checks the role **and** the record (ownership, state) (`SEC-01`).
- **Hide, don't just disable** forbidden actions (`FSC-02`): `Visible = False` (an If widget) removes them from the DOM; `Enabled = False` can be flipped in DevTools. Still enforced on the server.
- **Permission flags come from the server** (`FSC-03`): a data action returns `CanEdit`, `CanApprove` for *this record and this user*, computed in BL. Don't recompute permissions from roles + status on the client.
- **No identity from the client** (`SEC-09`): never pass `GetUserId()` or a user id as a parameter to a server action or data action. The server reads it.
- **Every data action and aggregate is an endpoint**: its inputs can be tampered with. Filters that restrict data by user/tenant/ownership are applied **on the server** inside the BL action, not as a client-supplied filter value (`FSC-04`).
- **Screen roles** on every screen; `Anonymous` only for genuinely public screens, whose server calls re-validate every input (`SEC-07`, `SEC-08`).
- **No sensitive data in URLs** (`SEC-06`, `SEC-13`): ids only; never emails, national ids, tokens.
- **Mask what users don't need** (national ids, phone numbers) in lists; the server returns the masked value, not the client.
- **Expressions encode by default**; `Escape Content = No` only for trusted, sanitized HTML (`EncodeHtml()` or the Sanitization extension). User values placed inside JavaScript use `EncodeJavaScript()` (`FSC-05`).
- **No entity actions from client logic** (`FSC-06`): calling `CreateOrUpdate<Entity>`/`Delete<Entity>` (directly or through a thin wrapper) from a client action raises the TrueChange security warning *"You're exposing a database operation in the client side"*. Call a use-case server action that validates and authorizes. Under the house architecture, Front-End and CW modules can't see CS entities anyway (`HSE-03`).
- **Every client-used aggregate, data action and server action is a REST endpoint.** On a screen with roles, only authenticated users with those roles can call it. On an **Anonymous** screen, those endpoints (including the ones in blocks placed on it) are public: every input must be re-validated and must not let a caller reach other records (`SEC-08`; TrueChange *"exposing a generic Server Action for public access"*).
- **Menus** (`FSC-07`): entries come from the server, filtered by role there, and the target screens have their own roles. A client-only hidden menu entry still leaves the screen reachable by URL.
- **One screen per role profile** when functionality differs: hidden widgets on a shared screen still ship their endpoints and logic to every role (official reactive security guidance).
- **Test screens never leave Development**; keep Forge components and plugins updated (`SEC-14`).
- **Logout clears** user-specific client variables and local storage entities (`STA-05`, `MOB-04`).

## 2. Frontend performance (`FPF-*`)
| Budget (guideline) | Value |
|---|---|
| At-Start data sources per screen (all blocks) | ≤ about 5, in parallel |
| Server calls per user action | 1 (`PERF-15`) |
| Rows sent to the client per list | one page (10–50) |
| Default server request timeout (Reactive/Mobile) | ≤ 10 s (`PERF-16`) |
| Images | ≤ 150 KB mobile / 500 KB web, ≤ 1024 px (`PERF-17`); TrueChange warns over 500 KB |
| First list load (mobile) | about 10 records, infinite scroll threshold 2000 px (`FET-06`) |
| Screen action / client action size | ≤ about 15 nodes (`CLG-05`) |

Rules:
- **Fetch only what's visible** (`FPF-01`): On-demand fetch for tabs, popups and details; only the fields the UI uses (`PERF-10`).
- **No server calls in client events** (`FET-01`, `PERF-08`).
- **Lists**: server paging; no block with its own data source inside a List (`BLK-05`); `List.Empty` instead of count (`PERF-14`).
- **Avoid re-render storms** (`FPF-02`): don't assign variables in OnRender; don't bind expressions to functions that do heavy work (they re-run every render); move heavy computation to the server or to `On After Fetch` once.
- **Large lists on screen**: paginate or use "Load more"; don't render 1,000 rows and hide them with CSS.
- **Images**: Image widgets have **width and height set** (no layout jump while loading), files sized to their display box, lazy for below-the-fold galleries; icons from the icon font/SVG, not PNGs (`FPF-04`).
- **Prioritize the main content**: secondary blocks render behind an If flag set once in OnRender, so their fetches start after the main content (`FPF-04`).
- **Animations in CSS**, not JavaScript (GPU vs CPU); if JS must animate, `requestAnimationFrame` (`FPF-05`).
- **Fix TrueChange performance warnings** before review: they flag splash-screen fetches, several server actions in one client action, server actions in loops, OnInitialize server/local-storage access, big JS nodes and big images (see the mapping table in review-checklist.md).
- **Scripts**: required only where used (`FPF-03`); no library loaded on every screen for one widget.
- **Measure**: browser DevTools Network (count and size of requests on load), Performance (long tasks) and the platform's Service Center/ODC monitoring for slow server calls. Record the before/after when optimizing.

## 3. Mobile and offline (`MOB-*`)
Architecture (one End-User module per app, `_MCW` per area, client-side `_MCS`) is owned by the architecture skill (`UI-05`).
- **Local storage entities**: few, **denormalized** per screen use case, labels instead of foreign keys, no binary blobs unless offline viewing needs them (`MOB-01`).
- **Read from local storage when offline-capable**; screens fetch with local aggregates, never with server calls in client events (`MOB-02`).
- **Sync**: `OfflineDataSync` with clear sync units, started with `TriggerOfflineDataSync`, UI updated on `OnSyncComplete`/`OnSyncError`; sync at login/splash and after business events, not on every screen (`MOB-03`).
- **Network-aware**: check `GetNetworkStatus` before online-only actions and explain what's unavailable offline; queue offline writes with a visible "pending sync" state (`MOB-03`).
- **Splash screen** (`MOB-06`): no aggregates or data actions (TrueChange warns), no heavy logic, few blocks. App-start data is fetched by the **default screen**; if it must load at startup, one server action designed for that stage, with secondary data deferred.
- **Lightweight local storage** (official): only the attributes the offline use case needs, only the user's relevant records (e.g. open tasks for this week), sync in **small chunks** with the most relevant data first (text before images; images compressed). Large local storage causes "Failed to allocate" errors on low-end devices.
- Start sync with **`TriggerOfflineDataSync`**, never by calling `OfflineDataSync` directly (that runs in the foreground and freezes the UI). Pass a **sync unit** so only the affected entities sync, with one action per local entity in the sync folder.
- **Secure local data** (`MOB-04`): no tokens or secrets in local storage entities; use the Ciphered Local Storage plugin for personal data at rest; clear on logout.
- **Plugins** are wrapped in Foundation modules, and their calls check availability before use (`MOB-05`).
- **Plugin fallbacks** (`MOB-07`): each plugin call is wrapped in a client action (`AddToContacts_Safe`) that returns an error, or mock data in development, when the plugin is missing, so the app still works in a desktop browser and on unsupported devices.
- **Client-side log** for field issues: a small local-storage log the user can upload when something fails, plus `$public.Logger` for Service Center.
- **Touch**: targets ≥ 44 px, gestures always have a button alternative (style guide `RSP-*`, `A11Y-*`).

## 4. Multilingual (`LOC-*`)
- **Every user-facing text is translatable** (`LOC-01`): literal texts in widgets and expressions, messages in client actions, `ValidationMessage`s, feedback messages, screen titles. Don't build sentences by concatenation ("You have " + N + " requests"): use a full-sentence text per case or a placeholder pattern that translators can reorder.
- **Data-driven labels** (statuses, types) come from static entities with a translated label attribute or a per-locale table, returned by BL (`LOC-02`).
- Locales (`en-US`, `ar-AE`…) are created in the module; translations go through **Service Studio's export/import** (the Model API can't write translations; see FLL-09).
- **Formats from the locale**: dates, numbers, currency through format helpers; never hard-code `dd/MM/yyyy` in many places (`LOC-03`).
- **RTL**: handled by the theme and logical CSS (style guide `TXT-02`); JS that computes positions must respect `dir`.
- Changing language: `SetCurrentLocale`, then reload data whose labels come from the server.


## Converted and measured screens (November 2026 review)
- **Convert to Reactive** (`STR-04`): the GA Service Studio option clones a Traditional module and converts it (producers before consumers). The clone works, but needs a cleanup pass: screen preparations become aggregates or data actions (fetch only what's shown, `FET-*`); session variables become server-side state or non-sensitive client variables (`STA-*`); Traditional widgets become OutSystems UI patterns; and because every aggregate, data action and server action the Reactive UI calls is a REST endpoint, add the server-side role and record checks the Traditional page never needed (`FSC-*`).
- **Measure first** (`FPF-06`): Performance Analytics (Beta, manual activation) gives client, network and server breakdowns and APDEX scores for Reactive and Mobile apps, linked to Code Quality (formerly AI Mentor Studio) findings. Without it, use the browser Performance and Network tabs and the screen-request logs. Record numbers before and after a change.
