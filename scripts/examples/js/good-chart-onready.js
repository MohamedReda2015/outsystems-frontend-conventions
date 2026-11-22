// Purpose: initialize the request chart on its container (block RequestChart, OnReady).
// In : $parameters.ContainerId (Text) - Widget.Id of the chart container
//      $parameters.DataJson    (Text) - serialized chart data
// Out: $parameters.ChartRef    (Object) - instance, destroyed in OnDestroy
// Async: no
// Cleanup: good-chart-ondestroy.js removes the resize listener and destroys the chart
const el = document.getElementById($parameters.ContainerId);
if (!el) {
  return;
}
const chart = RequestCharts.create(el, JSON.parse($parameters.DataJson));
const onResize = () => chart.resize();
window.addEventListener('resize', onResize);
chart.onResize = onResize;
el.querySelector('.req-chart__title').textContent = $parameters.Title;
$parameters.ChartRef = chart;
