# Frontend review: `<Module or feature>`

| Field | Value |
|---|---|
| Date | YYYY-MM-DD |
| Reviewer | |
| Platform / app type | O11 Reactive · O11 Mobile · ODC |
| Module(s) and layer | e.g. `Request_CW` (CW), `RequestPortal` (Front-End) |
| Naming style in force | `ConceptThing` / `Concept_Thing` |
| Scope | screens, blocks, actions reviewed |
| Tools run | `lint-os-js.mjs` (n files) · `check-names.mjs` (inventory date) · style-guide linter · TrueChange warnings (count before → after) · browser walk-through |

## Summary
- Blockers: n · Majors: n · Minors: n
- Verdict: ready / ready after Blockers / not ready
- Top three risks in one line each.

## Findings (most severe first)
| # | Rule | Sev | Element path | Evidence | Fix |
|---|---|---|---|---|---|
| 1 | FET-01 | Blocker | `RequestPortal › Requests › RequestDashboard › OnInitialize` | calls `Request_GetKpis` server action | replace with data action `GetKpis` (At Start) |
| 2 | | | | | |

## Browser verification (VER-01)
| Scenario | Result |
|---|---|
| Happy path | |
| Empty data | |
| Server error / offline | |
| Double-click Save | |
| Back from detail keeps filters | |
| Deep link by URL | |
| Phone / desktop (reload after resize) | |

## Not checked
List what couldn't be verified and why.
