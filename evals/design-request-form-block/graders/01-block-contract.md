---
type: llm
focus: output
weight: 1
---

design.md defines the block as a contract: named input parameters (an id such as RequestId with NullIdentifier for new, plus optional flags), events raised to the parent (such as OnSaved with the id, OnCancelled), and states that the block does not navigate itself; the screens handle navigation
