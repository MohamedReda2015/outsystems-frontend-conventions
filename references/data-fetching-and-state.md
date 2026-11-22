# Data fetching and state

Rules: `FET-*` (fetching) and `STA-*` (state) in review-checklist.md. Server-side query rules (indexes, Max. Records on server aggregates, no queries in loops) are in the architecture skill (`DAT-10`, `PERF-*`).

## 1. Where data comes from
| Source | Use when | House architecture note |
|---|---|---|
| **Screen/block aggregate** | read-only data from entities the module may reference | In CW blocks under the house chain, blocks don't see CS entities (`HSE-03`); aggregates appear only for **static entities exposed by BL** or in apps that don't use the 4-layer chain |
| **Data action** | anything else: BL Service Actions, computed or merged data, integrations | **The default in CW**: `GetX` data action → one BL Service Action → output Structure |
| **Server action called from a client action** | a *user action* that changes something (save, submit, approve) | never to *read* data on load (`FET-01`) |
| **Local storage entity** (Mobile) | offline data | see security-performance-mobile.md |

Every screen aggregate, data action and server action used from client logic becomes a **REST endpoint** the browser calls (official reactive security guidance). Treat each one's inputs as attacker-controlled (`FSC-04`).

**Server-to-client optimization** (Platform Server 11.12+, Reactive and Mobile): for screen aggregates, data actions and server actions called in screen actions, the platform analyses which fields the client uses and sends only those. It reduces payloads, but it is not a design tool: data actions still return purpose-built Structures, and nothing sensitive should reach a client-side source in the first place (`PERF-10`).

**Filtering by the current user**: `GetUserId()` written **inside** an aggregate's filter or a data action runs on the server and can't be tampered with. That's the official recommendation. A user id passed **in** from the client can (`SEC-09`, `FSC-04`).

### Data action conventions (`FET-04`)
- Name `Get<What>`; **one** output (a Structure or list of Structures) named for the content (`Request`, `Requests`), plus `TotalCount` for paged lists.
- Calls **one** BL Service Action (or one server action that composes several on the server). No loops of server calls.
- Returns only the fields the UI needs (`PERF-10`, `DAT-04`).
- Errors: a failed fetch leaves `IsDataFetched = False` and goes to the UI flow's OnException handler. For data areas that need an inline error state with Retry, the data action has an exception handler that logs and sets a `FetchError` (Text) output, which the block checks (`ERR-04`).
- Inputs are filters and ids; **never** the user id (`SEC-09`).

## 2. Fetch timing
- **At Start** for what the user sees first. All At-Start sources of a screen and its blocks run **in parallel**: keep it to what's above the fold.
- **Only on demand** (`FET-02`) for:
  - tab contents (refresh on tab change, once);
  - popups and sidebars (refresh on open);
  - details shown after a selection;
  - dependent data that depends on a **user choice** (refresh in the handler of that choice).
- Dependent data that does **not** depend on a user choice (A then B then C) is **one data action** that runs the queries in order on the server: one request instead of a chain of On After Fetch refreshes (official mobile best practice; `LCY-06`, `PERF-13`).
- **Prioritize the main content**: put secondary content (recommendations, charts, side panels) in a block inside an If whose flag is set once in the screen's OnRender. The block's own sources then start only after the main content rendered (official "prioritize screen content"; `FPF-04`).
- **Menus**: menu entries come from a data source that applies role checks on the server, cached (server cache or a client variable holding only non-sensitive labels and the cache time). Hiding entries on the client alone is not security (`FSC-07`).
- Re-fetch with **Refresh Data** after a successful save, or update the local list in place when the server returns the changed row (cheaper, no flicker).
- Avoid fetching the same data twice on one screen: lift it to the parent block and pass it down as parameters (`BLK-05`).

## 3. States on every data area (`FET-03`)
```
If  not GetRequests.IsDataFetched         → skeleton / spinner (a data action that fails without a handler stays here: see ERR-04)
ElseIf GetRequests.FetchError <> ""       → error message + Retry (Refresh Data)   (data actions with a FetchError output)
ElseIf GetRequests.List.Empty              → Blank Slate with next action
Else                                       → content
```
- The empty state checks `IsDataFetched` **first** (FLL-01): otherwise "No records" flashes on every load.
- After a **refresh**, keep the old content visible and show a subtle loading indicator instead of blanking the area.
- A filtered list that returns nothing says so ("No requests match these filters" + Clear filters), not the first-use empty state.

## 4. Lists and pagination (`FET-05`)
- Server-side paging: Max. Records = page size, `StartIndex` = page × size, total from `Count` (aggregate) or `TotalCount` (data action).
- Bind to the OutSystems UI **Pagination** pattern; refresh in its `OnNavigate` handler.
- Sort and filter on the server; client-side `ListSort`/`ListFilter` only on already-small lists (< about 200 rows).
- Page size: 10–25 for tables, 12–24 for cards; configurable per list in a client variable if users ask for it.
- Never load "all rows" to the client "just in case". Exports are a server-side action that returns a file.
- Search inputs: debounce (On Change + a short timer, or a Search button), minimum 2–3 characters for large lists.

### Mobile and phone lists: infinite scroll (`FET-06`, official mobile best practices)
- Use the List's **On Scroll Ending** event to fetch the next set (scaffolded lists already do it): start with about **10 records** and load a similar increment each time.
- The trigger distance defaults to **2000 px** before the end; tune it with the `infinite-scroll-threshold` attribute on the List.
- Show an animated loading indicator at the end of the list while fetching. Users should never hit a loading wall.
- **Keep list items simple**: no maps, charts or JavaScript widgets per row; no expandable "Show all…" content inside items (use Master Detail instead). Complexity multiplies by the row count.
- Set **width and height on Image widgets** (in lists and everywhere) so images don't make the layout jump while they load (`FPF-04`).

## 5. State: smallest scope that works (`STA-*`)
| Scope | Use for | Rules |
|---|---|---|
| **Local variable** (screen/block) | UI state: `IsSaving`, `SelectedId`, `ShowFilters`, form record | default; dies with the screen |
| **Block input parameter** | what the parent tells the block | read-only inside the block; don't assign it (`STA-01`) |
| **Screen input parameter** | ids and filters that make a URL meaningful | visible in the URL; ids and small values only (`SEC-13`) |
| **Client variable** | per-user, per-device **preferences**: page size, last tab, theme | basic types only; stored in the browser's local storage; **readable and editable by the user** and **shareable between apps** on the same domain (official), so name them with an app/area prefix; never tokens, roles, personal data or authorization flags (`STA-04`) |
| **Session variable** (server, Traditional Web or server logic) | small server-side context | no lists or records (`PERF-18`) |
| **Server data** | everything that must be true | the only source of truth |

Rules:
- **One source of truth per value** (`STA-02`). Don't keep a copy of a fetched record in another variable "to edit it" unless it's the form's working copy, initialized once from the fetch.
- **Form working copy**: initialize it in `On After Fetch` of the detail source, only when not `HasChanges`, so a background refresh doesn't wipe the user's edits.
- **Derived values are expressions**, not variables you keep in sync (`STA-03`): `CanSubmit = Form.Valid and not IsSaving`.
- **Client variables are documented**: name, purpose, default, who sets it. Clear user-specific ones on logout (`STA-05`).
- Don't use client variables to pass data between screens; use input parameters (ids) and fetch.

## 6. Caching on the client
- Reference data (statuses, types) used everywhere: fetch once per screen; for app-wide lookups, cache on the **server** (architecture skill, integration-and-caching) rather than in client variables.
- Never cache permissions on the client as the decision; a cached `CanApprove` only hides a button (`FSC-01`).
