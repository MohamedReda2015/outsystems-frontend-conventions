---
type: llm
focus: trace
weight: 1
---

review.md flags the server action calls in OnInitialize as a top-severity issue (serialized calls blocking render) and proposes data actions or aggregates fetched At Start in parallel (or one combined data action), citing FET-01 and/or PERF-08 or equivalent wording
