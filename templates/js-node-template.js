// Purpose: <one line: what this node does>
// In : $parameters.WidgetId (Text) — Widget.Id of the target element
//      $parameters.<Name>   (<Type>) — <meaning>
// Out: $parameters.<Name>   (<Type>) — <meaning>
// Async: no | yes (resolves with $resolve(), fails with $reject(error))
// Cleanup: <what OnDestroy must undo, or "none">

const el = document.getElementById($parameters.WidgetId);
if (!el) {
  return; // the widget is not rendered (for example inside a False If branch)
}

// ... work here: read values, call a wrapped library (styling: use the widget's Style Classes expression) ...
el.setAttribute('aria-busy', 'false');

// Async variant (delete the lines above if you use this):
// someLibrary.load(el)
//   .then((instance) => { $parameters.InstanceRef = instance; $resolve(); })
//   .catch((error) => { $reject(error); });
