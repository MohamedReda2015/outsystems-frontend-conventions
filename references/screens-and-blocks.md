# Screens and blocks

Rules: `BLK-*` and `NAV-*` in review-checklist.md. Architecture ownership (screens in Front-End, blocks in CW, blocks consume BL only) is in **outsystems-architecture** (`HSE-03`, `UI-01…03`). Look and patterns are in **outsystems-live-style-guide**.

## 1. Screens
A screen is a **composition**:
```
Screen RequestList (Front-End)
├─ Roles: custom roles only (SEC-07); Title set (A11Y-08)
├─ Input parameters: Status (Text, optional filter), Page (Integer, optional)
├─ Layout: theme layout block (LAY-01)
│  ├─ Title: "Requests" expression (translated)
│  ├─ Actions: NewRequest button → Destination RequestEdit (RequestId = NullIdentifier())
│  └─ MainContent:
│     ├─ RequestFilters (CW)   Status ← Status;  OnApply → RequestFiltersOnApply
│     └─ RequestTable (CW)     Status, Page;     OnSelected → Destination RequestDetail(RequestId)
└─ Screen actions: RequestFiltersOnApply (assign + navigate or refresh), nothing else
```
Rules:
- **No data sources on the screen** in the house architecture. Data is owned by blocks. Exception: a tiny value the layout needs (e.g. the record title for the H1) via a data action calling BL.
- Screen input parameters: **ids and simple filters** only. Mark mandatory only when the screen can't work without them (`NAV-02`).
- Screen actions are **handlers**: assign, navigate, refresh, call a UI helper. If a handler grows past about 10 nodes, the logic belongs in a block or in BL (`CLG-05`).
- One screen per role profile when behaviour differs a lot (security.md in the architecture skill). Don't pile `If CanX` branches into one screen.
- Every screen has a **Title** (translated), and custom roles. No `Anonymous` / `Registered` unless intended (`SEC-07`).

## 2. Blocks: the contract
Every public block has a contract, written before building (`templates/block-contract.md`):

| Part | Convention |
|---|---|
| **Purpose** | one sentence |
| **Input parameters** | the minimum to work; ids, not records; Mandatory = Yes only if required; sensible defaults for the rest; booleans `Is/Show/Can` |
| **Events** | everything the parent may need to react to: `OnSaved(RequestId)`, `OnCancelled`, `OnSelected(Id)`; mark **Mandatory** if ignoring it is a bug (e.g. `OnClose` of a popup) |
| **Placeholders** | named slots when the parent supplies content (`Actions`, `Footer`); no placeholder just for styling |
| **Data** | which data action / BL Service Action it uses; when it refreshes |
| **States** | loading, empty, error, populated (style guide `FDB-01`) |
| **CSS API** | its prefixed classes and knobs (style guide components-and-forms) |

Rules:
- **Structure, not business** (official front-end best practices): a reusable UI block holds structure and functional logic only. No business rules in it, no inline styles, no "objective" classes such as `.Bold` or `.Width20px`; data and rules come in through parameters, look comes from the theme.
- **Self-contained** (`BLK-01`): everything comes in through parameters; nothing is read from the screen, from sibling blocks, or from client variables that act as hidden parameters.
- **Talks out through events only** (`BLK-02`). Events travel **one level up**: a nested block's event must be re-raised by each block in between. If you find yourself relaying events through three levels, flatten the composition. Don't add a global pub/sub just to avoid it. A block doesn't navigate to another module's screens, doesn't refresh its parent and doesn't call parent actions (`BLK-03`, `UI-02`).
- **Refreshes in `OnParametersChanged`** (`BLK-04`): `Refresh Data` on the data sources that use the parameters, reset local state that depends on them. Remember `OnParametersChanged` fires only when a parameter value **changes**: to force a reload with the same values, pass a `RefreshToken` (Integer, increment it) or let the block expose its own refresh via an event round-trip.
- **No server calls per list item** (`BLK-05`, `UI-03`): a block inside a List gets its data as parameters from the parent's single fetch.
- **Keep the key when rebuilding** (`FLL-06`): clear and recreate a block's content instead of deleting the block, so consumers keep their references.
- **Breaking-change discipline** (`BLK-06`): new parameters are optional with defaults; removing or renaming parameters/events of a public block needs a new block (`RequestCardV2` is allowed *only* as a versioned replacement with the old one deprecated).

### Exceptions in blocks
An exception raised in a block is handled by the OnException of the flow of the **screen that uses the block**, not the block's own flow (official). A CW block that must show an inline error catches it in its own action (busy flag reset, `FetchError`/message shown). Anything it doesn't catch reaches the consuming app's handlers (`ERR-02`, `ERR-06`).

### Block sizes
- One responsibility per block. If a block has more than about **3 data sources**, **15 local variables** or **10 screen actions**, split it (`BLK-07`).
- Very generic "god blocks" configured by 20 booleans are worse than three specific blocks.

## 3. Popups and dialogs
- Use the OutSystems UI **Popup** pattern; its content is a block `<Concept><Purpose>Popup` with parameters and events (`OnConfirmed(…)`, `OnClose`).
- The **parent owns visibility**: a `ShowXPopup` boolean on the screen; the popup block raises `OnClose`, the parent sets it to False.
- Popup data uses **Fetch = Only on demand**, refreshed when opened (`FET-02`).
- Confirmations for destructive actions go through one shared helper (`ConfirmAction`), naming the object: "Delete request REQ-1024?" (style guide `FDB-04`).

## 4. Navigation (`NAV-*`)
- Internal navigation uses **Destination** to a screen, with parameters (`NAV-01`). No `"/App/RequestDetail?RequestId=" + …` strings; no `RedirectToURL` for internal pages.
- External links: URL from a site property/config action, opened with `RedirectToURL` or a Link with `target=_blank` + `rel=noopener` (`NAV-01`).
- **Back keeps context** (`NAV-03`): list screens take filters/page as optional input parameters (bookmarkable) or keep them in a client variable; detail screens navigate back with them.
- **After save**: on Edit screens, go to the Detail screen (or back to the list) with a success message; don't leave the user on a form that looks unsaved.
- **Unsaved changes**: forms that are long or costly to fill track `HasChanges` and confirm before navigating away (`NAV-04`).
- **Deep links** must work: a Detail screen opened by URL loads its data from `RequestId` alone and handles "not found / not allowed" with a proper message, not a blank page (`NAV-05`).

## 5. Reuse decision
1. Does an OutSystems UI pattern do it? Use it (the style guide's patterns catalog).
2. Does a CW block already do it (search by concept and by suffix)? Use it or extend it with an optional parameter.
3. Is it needed in 2+ screens or apps? Build a CW block with a contract.
4. Used once and trivial? Build it inline in the owning block, not on the screen.
