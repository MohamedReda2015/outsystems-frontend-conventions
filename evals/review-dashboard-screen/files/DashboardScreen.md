# Screen: Screen3 (Front-End module RequestPortal, UI flow MainFlow)

Roles: Registered. Title: (empty)

Local variables: Kpis (KpiSummary Record), Requests (List of Request), Loading (Boolean), Chart (Object)

Client variables (module): AuthToken (Text), LastUserId (Long Integer)

## OnInitialize (client action)
1. Loading = True
2. Server action `GetKpiSummary(UserId: GetUserId())` → assign to Kpis
3. Server action `GetMyRequests(UserId: GetUserId(), MaxRecords: 5000)` → assign to Requests
4. Server action `GetNotifications()` → assign to a hidden variable
5. Loading = False

## Widgets
- Container "b3-Container2" with the chart (JS in OnReady)
- If `Requests.Empty` → Text "You have no requests" else Table bound to Requests (all rows, sorted on client with ListSort)
- Button "Approve all" → ApproveAllOnClick

## ApproveAllOnClick
1. For each Requests: server action `ApproveRequest(Request: Requests.Current, UserId: GetUserId())`
2. Message "Done"
Exception handler AllExceptions → Message(AllExceptions.ExceptionMessage)
