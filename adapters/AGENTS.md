# AGENTS.md: OutSystems Frontend Conventions

<!-- Drop this file (or append it) at the root of any repository or workspace with OutSystems frontend work.
     Read by Codex, Jules, Aider, Claude Code, Gemini CLI and other agents that honour AGENTS.md.
     Pairs with the AGENTS.md adapters of outsystems-architecture, outsystems-backend-conventions and outsystems-live-style-guide. -->

## OutSystems frontend conventions
This workspace follows the **outsystems-frontend-conventions** skill. If the folder isn't in this repository, change the path to where it's installed.

- Entry point: `outsystems-frontend-conventions/SKILL.md`. Read it before any screen, block, client action, data action, form, popup or JavaScript task.
- Always-on rules: `outsystems-frontend-conventions/adapters/core-rules.md`.
- Details on demand: `outsystems-frontend-conventions/references/` (naming and structure; screens and blocks; lifecycle; data and state; client logic, forms and errors; JavaScript; security, performance, mobile and i18n; lessons learned).
- Reviews: `outsystems-frontend-conventions/references/review-checklist.md`. Cite rule IDs.
- JS lint: `node outsystems-frontend-conventions/scripts/lint-os-js.mjs <files>` (Node 18+, no install).
- Names: `node outsystems-frontend-conventions/scripts/check-names.mjs <inventory.json>`.

## Project decisions (fill in)
- Platform / app type: O11 Reactive | O11 Mobile | ODC
- Naming style: ConceptThing | Concept_Thing
- Result structure: `ActionResult` {IsSuccess, Message, Code, Errors[Field, Code, Message]} in `<Module>_BL` (or the project's equivalent)
- Handler naming: SaveOnClick (house) | OnSave (Synobsys); reusable blocks suffixed "Block": yes/no
- Feedback helper: `ShowFeedback` in `<Module>_CW` › UIHelpers
- Theme requires jQuery: yes/no
- Exceptions to this standard (with reason and date):
