var el = document.getElementById('b3-Container2');
window.kpiChart = new KpiLib.Chart(el, $parameters.Data);
el.innerHTML += '<small>' + $parameters.Subtitle + '</small>';
window.addEventListener('resize', function () { kpiChart.resize(); });
