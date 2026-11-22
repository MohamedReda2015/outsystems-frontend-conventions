---
type: llm
focus: output
weight: 1
---

design.md's save logic includes: a busy/double-submit guard (IsSaving or similar) reset on every path; client validation (Form.Valid and a cross-field validation such as due date); exactly one server call to a use-case action taking a structure (not an entity record); a result structure with field errors mapped back to inputs; success feedback then the event
