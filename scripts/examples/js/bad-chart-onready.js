var el = document.getElementById('b3-Container2');
window.requestChart = new Chart(el, { data: $parameters.Data });
el.innerHTML = '<span>' + $parameters.Title + '</span>';
el.style.color = '#ff0000';
window.addEventListener('resize', function () { requestChart.resize(); });
setInterval(function () { $actions.RefreshData(); }, 5000);
localStorage.setItem('authToken', $parameters.Token);
fetch('https://api.example.com/v1/requests?apiKey=abc').then(function (r) { console.log(r); });
if (!confirm('Are you sure?')) { return; }
$('#Save').on('click', function () {});
el.classList.add('is-ready');
OutSystems.Internal.Debugger.enable();
