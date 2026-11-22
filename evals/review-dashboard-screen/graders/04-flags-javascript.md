---
type: llm
focus: trace
weight: 1
---

review.md flags at least three JavaScript problems in KpiChart.onready.js: hard-coded generated id (use Widget.Id via $parameters), global window.kpiChart, innerHTML with parameter data (XSS), resize listener never removed in OnDestroy. Running scripts/lint-os-js.mjs is a plus but not required
