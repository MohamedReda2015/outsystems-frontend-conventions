---
type: llm
focus: trace
weight: 1
---

review.md flags both: (a) GetUserId() / UserId passed from the client to server actions (the server must read the user itself; SEC-09 or equivalent), and (b) the AuthToken (and user id) stored in client variables as sensitive data readable by the user (STA-04 or equivalent)
