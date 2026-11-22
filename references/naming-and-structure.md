# Naming and module structure

Rules: `NAM-*` (names) and `STR-*` (folders and flows) in review-checklist.md. Module names and suffixes (`_CW`, `_MCW`, `_BL`, `_Th`…) are owned by the companion skill **outsystems-architecture** (`ARC-07`, `HSE-05`).

## 1. General rules
- **English, PascalCase**, full words. Agreed acronyms stay upper-case only when they are two letters (`IdP`, `UI`); otherwise `Kpi`, `Sla`, `Api`. Pick once and record it in AGENTS.md.
- **One style per project** (`NAM-01`):
  - default `ConceptThing` (`RequestList`, `RequestCard`);
  - alternative `Concept_Thing` (`Request_List`, `Request_Card`), which sorts nicely in large modules.
  - Never mix them in one module.
- **Never ship default names** for anything referenced in logic, CSS, JS or tests (`NAM-02`): `Screen1`, `Block2`, `Action1`, `ClientAction3`, `Container7`, `Input_Text2`, `Aggregate1`, `DataAction1`, `GetUsers2`.
- No noise words: `New`, `Copy`, `Old`, `Temp`, `Test`, `Final`, `2`, `V2` (a breaking replacement is a new **version**, not a suffix on a screen).
- Name by **meaning**, not by look or position: `StatusTag`, not `GreenLabel`; `RequestSummary`, not `TopBox`.
- Dates say what happened or is due: `SubmittedOn`, `DueDate`, `CallStartDateTime`, not `Date1` or `TheDate`.
- Local constants (fixed values used in logic) may use a `Const` prefix (`ConstPollingSeconds`); configurable values belong in site properties or settings, not constants.
- A name stays true after a refactor. If the meaning changed, rename (OutSystems updates references), then check Impact Analysis.

## 2. Element patterns
| Element | Pattern | Good | Bad |
|---|---|---|---|
| UI Flow | `<Concept>` or `Common` | `Requests`, `Admin`, `Common` | `MainFlow` holding 40 screens |
| Screen | `<Concept><Purpose>`: `List`, `Detail`, `Edit`, `New`, `Dashboard`, `Search`, `Wizard` | `RequestList`, `RequestDetail` | `Requests2`, `Page1`, `Main` |
| Popup screen (Core, reusable) | `<Concept><Purpose>Popup` | `DocumentPreviewPopup` | `Popup1` |
| Block | `<Concept><Thing>`; suffixes `Form`, `Card`, `List`, `Table`, `Filters`, `Header`, `Summary`, `Timeline`, `Popup`, `Wizard`, `Kpi` | `RequestFilters`, `RequestApprovePopup` | `Block1`, `MyBlock`, `RequestBlock` |
| Layout block (theme) | `Layout<Kind>` | `LayoutTopMenu`, `LayoutBlank` | `Layout2` |
| Screen/block action (handler) | `<Trigger><Event>` | `SaveOnClick`, `StatusOnChange`, `RequestFiltersOnApply`, `GetRequestsOnAfterFetch`, `OnReady` | `ButtonClick`, `Action1` |
| Screen/block action (shared within the screen) | `<Verb><Object>` | `ResetFilters`, `LoadPage` | `DoStuff` |
| Client action (module, reusable) | `<Verb><Object>` in a folder by kind | `ShowFeedback`, `FormatFileSize`, `MapErrorsToInputs` | `Helper`, `Util1` |
| Data action | `Get<What>` | `GetRequestDetail`, `GetRequestsPage` | `DataAction1`, `LoadData` |
| Aggregate | `Get<Entities>` (plural for lists) | `GetRequests`, `GetStatuses` | `GetRequestsByStatusAndUserAndDate2` |
| Block event | `On<Happened>` | `OnSaved`, `OnCancelled`, `OnSelected`, `OnPageChanged` | `Click`, `Event1`, `Saved` |
| Input parameter | noun; ids end in `Id`; booleans `Is/Has/Can/Show` | `RequestId`, `IsReadOnly`, `ShowActions` | `Rec`, `Flag`, `Param1` |
| Local variable | noun; booleans `Is/Has/Can/Show`; lists plural | `SelectedIds`, `IsSaving`, `HasChanges` | `Var1`, `Temp`, `Bool` |
| Output parameter | noun | `IsValid`, `Result` | `Out1` |
| Client variable | `<Area><Name>` | `RequestListPageSize`, `PreferredTheme` | `Data`, `Token` |
| Widget (when named) | `<Meaning><WidgetType>` | `TitleInput`, `SaveButton`, `RequestTable`, `FiltersContainer` | `Input_Text2`, `Container3` |
| Structure (BL) | `<Concept><Purpose>` | `RequestSummary`, `ActionResult`, `ValidationError` | `Struct1`, `DTO` |
| CSS class | module-acronym prefix (style guide `THM-03`) | `req-card__title` | `.card`, `.title` |
| JS script resource | `<Concept><Purpose>.js` | `ChartHelpers.js` | `script.js` |

### Accepted project alternatives (community)
Some teams follow the public Synobsys standard, which differs in three places:

| Element | House default | Synobsys form |
|---|---|---|
| Screen action / handler | `SaveOnClick`, `FiltersOnApply` | `On<Action>`: `OnSave`, `OnCustomerSelected` |
| Reusable block | `RequestCard` | functional name + `Block`: `CustomerViewBlock` |
| Screen purposes | `List`, `Detail`, `Edit`, `New`, `Dashboard`… | `List`, `Edit`, `View` |

Either is fine **if the project records its choice in AGENTS.md and uses it everywhere** (`NAM-01`). `check-names.mjs --handlers on-prefix --block-suffix` checks the Synobsys form. Synobsys also asks to name major widgets (tables, lists, forms) but "do not name every container", which matches the widget threshold below.

### Event names in practice
- A block event names **what happened in the block's language**, not what the parent will do: `OnApproved`, not `OnRefreshParentList`.
- Its handler on the screen is `<BlockInstance><Event>`: `RequestFiltersOnApply`, `RequestApprovePopupOnApproved`.
- Event parameters carry ids and small values: `OnSelected(RequestId)`, never the whole record.

### Widget naming threshold
Name a widget when it is used by:
- logic (`SetFocus`, `.Valid`, `.ValidationMessage`, `.Id` passed to JS);
- a test or an automation script;
- CSS that must target it (prefer a style class instead).

Leave purely structural containers unnamed.

## 3. Folder and UI flow structure (`STR-*`)
Group by **concept first, kind second** (memory of the house rule: never a flat list).

### Front-End module
```
UI Flows
├─ Common            (Login, InvalidPermissions, layout-level screens; from the template)
├─ Requests          RequestList, RequestDetail, RequestEdit
├─ Approvals         ApprovalInbox, ApprovalDetail
└─ Admin             SettingsEdit, UserRoles
Logic › Client Actions
├─ Navigation        (screen-level helpers if any)
└─ (nothing else: logic lives in CW/BL)
```
- One UI Flow per concept, plus `Common`. Each flow has its own **OnException** handler (`ERR-02`).
- Screens grouped with a concept prefix even inside a flow, so search and Ctrl-F work.

### CW / MCW module
```
UI Flows
├─ Requests          RequestCard, RequestFilters, RequestForm, RequestApprovePopup
├─ Approvals         ApprovalTimeline, ApprovalActions
└─ Common            FeedbackHost, EmptyState, PageHeader
Logic › Client Actions
├─ UIHelpers         ShowFeedback, ConfirmAction, MapErrorsToInputs
├─ Formatting        FormatFileSize, FormatDuration
└─ Validation        ValidateEmail, ValidateEmiratesId (format only)
Data › Client Variables  (few, documented)
Scripts                  ChartHelpers.js (module-level scripts only)
```
- Blocks are grouped by **concept** into UI flows (flows are the folders for blocks).
- Client actions grouped by **kind** in folders (`UIHelpers`, `Formatting`, `Validation`).
- Public elements carry a **Description** (`HSE-06`): what it does, parameters, events, side effects.

## 4. Public surface
- Only blocks and client actions meant for other modules are **Public = Yes** (`STR-03`). Internal pieces of a block (sub-blocks used once) stay private.
- New blocks are private by default. Set Public deliberately and document the contract (`templates/block-contract.md`).
- Changing a public block's mandatory parameters or events is a **breaking change**: add a new optional parameter, or a new block version, instead (`BLK-06`).
