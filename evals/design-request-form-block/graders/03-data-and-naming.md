---
type: llm
focus: output
weight: 1
---

design.md loads the existing request with a Get… data action (not a server action in OnInitialize), refreshes on OnParametersChanged, binds the form to a working-copy structure, and the names follow PascalCase conventions (RequestForm, SaveOnClick, IsSaving, OnSaved, GetRequestDetail or similar); attachments are validated on the server too
