// Purpose: load the map library, then create the map on its container.
// In : $parameters.ContainerId (Text) - Widget.Id of the map container
// Out: $parameters.MapRef (Object)
// Async: yes ($resolve / $reject)
const el = document.getElementById($parameters.ContainerId);
if (!el) {
  $resolve();
} else {
  RequestMaps.load()
    .then((maps) => { $parameters.MapRef = maps.create(el); $resolve(); })
    .catch((error) => $reject(error));
}
