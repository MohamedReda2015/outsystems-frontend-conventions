// Purpose: load the summary for the KPI header (block KpiHeader).
// Async: yes
$actions.GetSummary().then(function (result) {
  $parameters.Total = result.Total;
  $resolve(result);
});
const view = $public.Internals.currentView();
