// Purpose: re-initialize the corporate header menu after the screen renders.
// Async: no
// jsc-ignore JSC-09: the corporate theme's header requires jQuery (FLL-13)
jQuery(document).trigger('corp-header:init');
