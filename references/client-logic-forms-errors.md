# Client logic, forms, errors and feedback

Rules: `CLG-*` (client logic), `VAL-*` (forms and validation), `ERR-*` (errors and feedback). Server-side exception handling, logging and transactions are in the architecture skill (`DAT-05`, `DAT-08`). Visual feedback patterns are in the style guide (`FDB-*`, `FRM-*`).

## 1. Client and screen actions (`CLG-*`)

### The user-action skeleton
Every handler that changes data has this shape:
```
SaveOnClick
 1. If IsSaving → End                                  (double-submit guard, CLG-03)
 2. Validate: Form.Valid and ValidateRequestForm()      (client validation, VAL-02)
      not valid → SetFocus(first invalid) → End
 3. IsSaving = True
 4. Server action: Request_Save(RequestInput)           (ONE call, CLG-01) → Result (ActionResult) + RequestId
 5. If not Result.IsSuccess →
      Result.Code = "CONCURRENT_UPDATE" → explain, offer Reload (VAL-08)
      otherwise → MapErrorsToInputs(Result.Errors) / ShowFeedback(Result.Message, Error)
      → IsSaving = False → End
 6. ShowFeedback("Request saved", Success)
 7. Trigger OnSaved(RequestId)  (in a block)  or  Destination RequestDetail(RequestId)  (on a screen)
 8. IsSaving = False   (also in the exception handler)
Exception handler (AllExceptions) → IsSaving = False → re-raise or ShowFeedback(generic) + log
```
Rules:
- **One server call per user action** (`CLG-01`, `PERF-15`). If you need two, the server needs one action that does both (one round-trip; one transaction only if its implementation has no remote or explicit commit boundaries).
- **The client doesn't orchestrate business steps** (`CLG-02`): no "save header, then loop to save lines, then send email" in a client action. That is a BL use-case action.
- **Double-submit guard** (`CLG-03`): an `IsSaving`/`IsBusy` local variable; the button is `Enabled = not IsSaving` and shows Button Loading (style guide `CMP-*`). Reset it on **every** exit path, including exceptions.
- **Reusable client logic lives in CW `UIHelpers`** (`CLG-04`), not copied into screens: `ShowFeedback`, `ConfirmAction`, `MapErrorsToInputs`, formatting helpers.
- **Short and readable** (`CLG-05`, `MNT-03`): a screen action over about 10–15 nodes, or any nested If ladder over 3 levels, is extracted into named client actions or moved to the server.
- **Server actions called from the client are use-case actions** (`SEC-11`): `Request_Submit(RequestId, Comment)`, never a generic `Request_Update(RequestRecord)` that lets the browser set any field.
- **Client actions don't hold business rules** that must be true (`CLG-06`): calculations shown to the user may be duplicated on the client for responsiveness, but the server recomputes and wins.
- Client-side **functions** (Function = Yes) must be pure and fast: no server calls, no side effects.

### Client action folders and descriptions
Module client actions go into folders by kind (`UIHelpers`, `Formatting`, `Validation`) with a Description stating inputs, outputs and side effects (`HSE-06`).

## 2. Forms and validation (`VAL-*`)

### Client side (for the user)
- Use the **Form** widget; set **Mandatory** on required inputs and the right **Input Type** (Integer, Email, Date…); built-in type validation does the rest (`VAL-01`). Only Mandatory fields are checked for emptiness.
- The button or link that submits has **Built-In Validations = Yes** on its event (the default when the handler is created from the event's "New Client Action" accelerator); the handler checks `Form.Valid` first (`VAL-07`).
- Edit the default texts once per module in the module's **Validation Messages** (translated) instead of overriding them per input (`VAL-07`).
- Cross-field and format rules go into one client action `Validate<Form>` that:
  - sets `<Input>.Valid = False` and `<Input>.ValidationMessage = "…"` per field;
  - returns `IsValid`;
  - is called after the built-in check (`VAL-02`).
- Validate **on submit**, then **on change/blur** for fields already marked invalid (don't shout at the user while they type the first time).
- Messages say what to do: "Enter a date after the start date", not "Invalid input" (style guide `TXT-*`).
- Focus the first invalid field after a failed submit (`SetFocus`) (accessibility, style guide `A11Y-*`).
- Inputs **inside a List** can't be set through `Input.Valid` in the usual way: use the JavaScript API `$public.Validation` from a small, wrapped client action (official JS API).
- Setting any input's `Valid = False` makes `Form.Valid = False`; set `ValidationMessage` together with it.

### Server side (for the truth)
- The BL action **re-validates everything** (`VAL-03`, `SEC-08`): mandatory fields, formats, lengths, ranges, state transitions, permissions, ownership.
- Expected business outcomes come back in the standard **result structure** (`VAL-04`), defined once in BL. It is the same contract as the companion skill outsystems-backend-conventions:
```
ActionResult
  IsSuccess   Boolean
  Message     Text                     (user-facing, translated)
  Code        Text                     (stable UPPER_SNAKE: REQ_LOCKED, CONCURRENT_UPDATE…)
  Errors      List of ValidationError { Field Text, Code Text, Message Text }
+ separate outputs for data (RequestId, …)
```
- `Field` uses the **attribute name of the input structure** (`Title`, `DueDate`), so `MapErrorsToInputs` can map them to widgets by a simple switch. Errors without a matching input go to a summary.
- **Branch on `Code`, not on message text** and not on custom exception types: user-exception types don't reliably cross Service Action boundaries, so the backend returns codes for everything the UI must react to.
- **Optimistic concurrency** (`VAL-08`): edit forms keep the `Version` (or `UpdatedOn`) received with the record in the working copy and send it back. On `CONCURRENT_UPDATE`, tell the user someone else changed the record, keep their input visible, and offer to reload. Never overwrite silently.
- Unexpected failures (database down, integration error, bug) are **exceptions**, not `IsSuccess = False` (`VAL-05`). Don't wrap every server action in a catch-all that returns `IsSuccess = False` with the exception text: that hides bugs and leaks internals.

### Form data
- The form binds to a **working copy** Structure (`RequestInput`), not to a fetched entity record (`VAL-06`, `SEC-11`).
- Initialize the working copy once from the fetch (`On After Fetch`, guarded by `not HasChanges`).
- Dropdowns bind ids; options come from a data source, not hard-coded lists (static entities via BL).
- Dates: Date widgets bound to Date/DateTime, displayed with the app's format helper; never parse user-typed date strings manually.
- File uploads: check type and size on the client for UX, **and** on the server (`SEC-04`).

## 3. Errors (`ERR-*`)

### How the platform routes exceptions (official)
- An exception goes to the **first matching Exception Handler** up the call stack: in the action itself, then the calling actions, then the UI Flow's **OnException**, then the module's **Global Exception Handler** (module property, default `Common` › `OnException`).
- An exception raised inside a **block** is handled by the OnException of the flow of the **screen that uses the block**, not the block's own flow.
- Reactive modules have **no public exception handlers**. Every Front-End module (and every app) needs its own flow handlers and Global Exception Handler (`ERR-06`).
- **OnApplicationReady** isn't covered by the Global Exception Handler: handle errors inside that action.
- Errors from integrations (REST, extensions) can't be told apart by type: catch them with **All Exceptions** where you call them, and log.
- In JavaScript, only `$reject()` raises an OutSystems exception. An unhandled rejection shows the platform's default error feedback (`JSC-16`).
- Server calls that exceed the request timeout raise a **Communication Exception**.

### Handlers
- **Every UI flow has an OnException handler** (`ERR-02`) that:
  - handles `SecurityException` → if not logged in, go to Login (keep the return URL); else go to `InvalidPermissions`;
  - handles `CommunicationException` → "You appear to be offline or the server is not responding. Try again.";
  - handles `User Exception`s raised **in this module** → show `ExceptionMessage` (written for users and translated);
  - handles `AllExceptions` → generic "Something went wrong. Try again or contact support (ref: …)" + log (`ERR-01`).
- The module's **Global Exception Handler** property points to the `Common` flow's OnException, and that handler covers the same four cases (`ERR-06`).
- Don't rely on catching **specific user-exception types from BL Service Actions**: they may arrive as a generic exception with only the message. Business outcomes the UI must branch on come back as `ActionResult` codes (`VAL-04`).
- **Never show `AllExceptions.ExceptionMessage` to end users** (`ERR-01`): it can contain SQL, stack details or internal URLs.
- Client actions with their own exception handler **reset busy flags** and either re-raise or give feedback. They never swallow silently (`ERR-03`, `DAT-08`).
- Data areas that must survive a failed fetch use a `FetchError` output on their data action and an inline error state with **Retry** (`ERR-04`).
- User exceptions raised in BL follow the backend skill's standard set (`NotFoundException`, `NotAuthorizedException`, `ConflictException`…), with translated messages that are safe to show.

## 4. Feedback
- **One helper** for transient messages: `ShowFeedback(Message, Type)` wrapping the platform Message node (or `$public.FeedbackMessage.showFeedbackMessage(message, type)` from JS: 0 Info, 1 Success, 2 Warning, 3 Error, HTML-encoded by default), so timing and look are consistent (`ERR-05`).
- Success after save/submit: short, past tense, names the object ("Request REQ-1024 submitted").
- Long operations (> about 1 s): Button Loading on the trigger; > about 10 s: run on the server asynchronously (timer / process) and show status, not a spinning button (`PERF-16` timeout).
- Destructive actions: confirmation dialog naming the object and the consequence; the confirm button says the action ("Delete request"), not "OK" (style guide `FDB-04`).
- Don't use browser `alert()` / `confirm()` (`JSC-12`).
