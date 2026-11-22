// Purpose: clean up the request chart (block RequestChart, OnDestroy).
// In : $parameters.ChartRef (Object) - instance created in OnReady
// Async: no
const chart = $parameters.ChartRef;
if (chart) {
  window.removeEventListener('resize', chart.onResize);
  chart.destroy();
}
