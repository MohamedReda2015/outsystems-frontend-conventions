# Frontend state, permissions and runtime verification

## Record identity and asynchronous data (FRV-01)

Give each data area an explicit query key: record/snapshot ID, filters, page and sort. OnParametersChanged compares relevant keys and refreshes only affected sources. Preserve dirty form values on unrelated refreshes; when identity changes, reset or confirm navigation according to the existing unsaved-changes UX.

For custom async calls/searches, debounce input when useful, attach a monotonic request token or query key, and ignore a response if the active key changed or the block was destroyed. Cancel work if the API supports it; cancellation is not a correctness guarantee. Use framework data sources where suitable and verify their race behavior rather than adding a redundant custom request layer.

Model loading, refreshing-with-data, empty, error and populated separately. Empty is valid only after the correct query completed successfully. Failed and empty are different; stale data is either cleared on identity change or visibly marked as stale for the same identity. Independent initial reads may run in parallel, but dependent reads require an explicit dependency.

Do not bind real identity/header data to sample dependent cards. Switch the related provider contracts together, or render unavailable states with known source gaps. Historical screens use the request/snapshot context, not automatically the current master record.

## Action-specific permission matrix (FRV-02)

For each action define: server option/code, visibility, enabled condition, required fields/reason, limits, confirmation and post-action refresh. Check permission for the specific command, not a general edit flag. A read-only record may still permit a supervisor to reassign or release a task. Keep those reason fields usable while ordinary editing remains disabled.

Reload eligible choices when context changes. Exclude the current assignee by immutable user ID rather than display label. The backend validates that the selected candidate remains eligible at submission. Hide an empty action bar while preserving useful read-only/assignment explanation.

## Command outcomes and recovery (FRV-03)

Use the shared `ActionResult {IsSuccess, Code, Message, Errors[{Field, Code, Message}]}`; branch on Code and translate text. Do not silently change an existing contract. Treat field length/required rules consistently in input, client validation, DTO and server validation. Validate before confirmation so the user does not confirm an invalid request.

Set and clear busy flags on every success/failure path, preserving input on conflicts. A network timeout may follow a committed command: keep the same idempotency key and reconcile the operation before offering a potentially duplicating retry. Disable double clicks for usability; rely on server concurrency/idempotency for integrity.

One server command per business operation is a useful default, not a prohibition on independent UI reads. A combined wrapper is atomic only if its backend transaction map proves it. Refresh dependent data after confirmed success; show pending progression for asynchronous work. Do not replace an unknown outcome with a success toast.

## Lifecycle and runtime checks (FRV-04)

Prefer native events/pattern APIs. Custom JS must scope DOM lookup to the supplied widget ID and live block, unregister listeners, clear timers and destroy instances. Ensure each async node settles once, including rejection and teardown; ignore callbacks targeting a destroyed instance. Avoid storing sensitive responses in global objects or persistent browser storage.

Exercise: rapid A→B selection with responses returning B→A; navigate away during loading; parameter changes with unsaved edits; simultaneous updates; each role's action/reason fields; expired session; failed save; timeout with server commit; and real-data provider switch. Inspect the rendered state and server evidence. A screenshot or clean TrueChange output alone cannot prove save behavior.

Use the style-guide accessibility checks for focus/error announcements, keyboard actions and RTL. Screen-reader announcements should describe the current query/result, not a late response for the prior record.

## Sources and provenance

- [Official screen/block lifecycle](https://github.com/OutSystems/docs-product/blob/master/src/building-apps/ui/screens/screen-block-lifecycle-events.md): lifecycle responsibilities. The query-key/dirty-state patterns are engineering guidance for custom asynchronous work.
- [Official Service Actions](https://success.outsystems.com/documentation/11/building_apps/reusing_and_refactoring/use_services_to_expose_functionality/): remote failure and transaction boundaries.
- Anonymized prior-project observations reviewed 2026-11-22: a supervisor could act but could not enter the required reason; assignee filtering needed an ID added to the contract; published/runtime evidence lagged model changes; real source wiring risked leaving sample dependent cards. Verify the generalized acceptance cases above.

### Evidence for real-data and permission transitions

Treat mock/live mode, selected subject, filters and locale as part of the query identity when they affect output. When changing provider or subject, invalidate dependent blocks and discard prior responses; do not show a live header above unrelated mock details. Distinguish no data, not loaded, unavailable and not authorized. A missing permission must not appear as a successful empty search.

Create a role × action × state matrix for the decision panel: action visibility, enabled state, required reason fields, confirmation and server outcome. Keep reason inputs available to the roles that can reassign or force-release even if ordinary edit permission is false. Use stable identifiers to exclude an existing assignee, not display labels.

Acceptance includes subject/provider switching during an in-flight request, session expiry after load, stale permission rejection, and refresh after a successful write. Capture version and provider mode so a screenshot of an older or mocked screen is not used as proof of the new behavior. Use the appropriate [ODC UI testing approach](https://success.outsystems.com/documentation/outsystems_developer_cloud/testing_apps/web_ui_testing/) or O11 test strategy; these scenario choices are generalized project lessons.
