# OutSystems Frontend Conventions

[![CI](https://github.com/MohamedReda2015/outsystems-frontend-conventions/actions/workflows/ci.yml/badge.svg)](https://github.com/MohamedReda2015/outsystems-frontend-conventions/actions/workflows/ci.yml)
![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/OutSystems-O11%20Reactive%20%7C%20Mobile%20%7C%20ODC-0f54da)
![Rules](https://img.shields.io/badge/rules-105-2b7a3b)
![Node](https://img.shields.io/badge/node-%3E%3D18-555)

**An agent-independent skill that teaches AI coding agents (and people) to write OutSystems frontend code the same way every time:** names and folders, block contracts, screen and block lifecycle, data fetching and state, client logic, forms and validation, errors and feedback, navigation, JavaScript, frontend security and performance, Mobile/offline and multilingual.

It works with **Claude Code, Claude.ai, Cursor, GitHub Copilot, Codex, Gemini CLI, Aider** and any custom LLM agent. It's plain Markdown plus two dependency-free Node.js tools: a **JavaScript-node linter** and a **module inventory checker**.

> Not affiliated with or endorsed by OutSystems. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

---

## Why

Reactive and Mobile apps run their screens in the browser. The typical failures are invisible in Service Studio and only show up in production:
- **Slow screens**: server actions called in `OnInitialize` or `OnReady`, chains of fetches in `On After Fetch`, several server calls per click.
- **Flashing or wrong states**: "No records" shown before the data arrives; no error or loading state; double-submitted forms.
- **Security holes**: every client-used aggregate and server action is a public REST endpoint, yet user ids come from the client, entity actions are called directly, and tokens sit in client variables.
- **Fragile JavaScript**: generated ids that change on republish, globals that leak across screens, promises without error handling, internal APIs that break on upgrade.
- **Unreadable modules**: `Action1`, `Block2`, flat folders, blocks that reach into their screens.

This skill gives an agent the rules, the reasoning behind each one, and tools to check its own output. The rules are grounded in the official OutSystems documentation, the platform's TrueChange warnings and lessons from real enterprise projects.

## What's inside

| Area | Highlights |
|---|---|
| **Naming and structure** | patterns for screens, blocks, handlers, data sources, events, variables and widgets; concept UI flows; the public surface; accepted community alternative (Synobsys) |
| **Screens and blocks** | screens compose, blocks own; block contracts (parameters, events, placeholders); popups; navigation; reuse decisions; exceptions in blocks |
| **Lifecycle** | the official event order, what each event is for and must never do, render loops, third-party components, polling |
| **Data and state** | aggregates vs data actions, fetch modes, loading/error/empty states, server paging, infinite scroll, state scopes, client variables |
| **Client logic, forms, errors** | the user-action skeleton, the shared `ActionResult` contract, validation twice, optimistic concurrency, exception routing, feedback |
| **JavaScript** | the JS node contract, the async model (`$resolve`/`$reject`), the public `$public` API, security (XSS, CSP), DOM and styling, libraries |
| **Security, performance, Mobile, i18n** | the browser is public, budgets, splash screens, offline sync, plugin fallbacks, translations |
| **Review** | 105 rules with IDs and severities, a TrueChange-warning map, a review report template, 25 lessons learned |

```
SKILL.md                         entry point (read first)
references/                      detail files, read on demand
  naming-and-structure.md
  screens-and-blocks.md
  lifecycle-and-events.md
  data-fetching-and-state.md
  client-logic-forms-errors.md
  javascript.md
  security-performance-mobile.md
  lessons-learned.md
  review-checklist.md            every rule: ID, severity, how to check; TrueChange warning map
templates/                       block contract, frontend review report, JS node header
scripts/lint-os-js.mjs           JavaScript-node linter (JSC rules)
scripts/check-names.mjs          module inventory checker (NAM, STR, BLK, LCY, FET, FSC, MOB…)
scripts/examples/                good and bad examples for both tools
adapters/                        compact core rules, AGENTS.md, Cursor rule, Copilot instructions
evals/                           behaviour test cases (prompt + files + graders)
docs/assessment-2026-11.md       research sources and gap assessment
tests/                           node:test suite (npm test)
```

## Install

**Claude Code**: clone into your skills folder (all projects) or into one repository's `.claude/skills/`:
```bash
git clone https://github.com/MohamedReda2015/outsystems-frontend-conventions ~/.claude/skills/outsystems-frontend-conventions
```

**Claude.ai / Claude Desktop**: download `outsystems-frontend-conventions.zip` from the [latest release](https://github.com/MohamedReda2015/outsystems-frontend-conventions/releases/latest) and upload it under *Settings → Capabilities → Skills*.

**Other agents**: keep the folder in your repository (or adjust the paths), then:
| Agent | Copy |
|---|---|
| Codex, Gemini CLI, Aider, Jules, any AGENTS.md reader | `adapters/AGENTS.md` → repository root |
| Cursor | `adapters/cursor/outsystems-frontend-conventions.mdc` → `.cursor/rules/` |
| GitHub Copilot | `adapters/copilot-instructions.md` → `.github/copilot-instructions.md` |
| Any chat assistant | paste `adapters/core-rules.md` into its custom instructions |

## Quick start

Ask your agent things like:
- "Add a request list screen with filters to `RequestPortal`."
- "Why does my list show *No records* for a second?"
- "Review the dashboard screen before UAT."
- "Wire the Save button on the request form."

The agent reads `SKILL.md`, does its Step 0 (platform, layer, what exists, naming style), and loads only the reference it needs.

## Tools

Both tools need Node.js 18+, install nothing, make no network calls, and exit with code 1 when they find a Blocker or Major issue, so they can gate a CI step.

### JavaScript-node linter
Put each JavaScript node in its own `.js` file. Lint a block's `OnReady` and `OnDestroy` nodes together so cleanup is checked across them.
```bash
node scripts/lint-os-js.mjs path/to/nodes/ [--json] [--list-rules]
```
```text
scripts/examples/js/bad-async-node.js:3  Major    JSC-16  Asynchronous call without error handling, or $resolve() called with arguments (then() without catch())
scripts/examples/js/bad-async-node.js:7  Major    JSC-17  Internal/unsupported platform API; use only $public, $actions, $parameters, $roles
```
Suppress a finding only with a reason: `// jsc-ignore JSC-09: corporate theme requires jQuery`.

### Module inventory checker
Describe the module in JSON (format: [`scripts/examples/inventory/README.md`](scripts/examples/inventory/README.md)), built from the Service Studio MCP read tools or by hand.
```bash
node scripts/check-names.mjs inventory.json [--style pascal|underscore] [--handlers trigger-event|on-prefix] [--block-suffix] [--json]
```
```text
Blocker  FSC-06   RequestPortal › MainFlow › RequestDetailsPage › action SaveOnClickCopy
         Entity action called from client logic: calls CreateOrUpdateRequest from the client; use a validating server action
Blocker  LCY-07   RequestPortal › MainFlow › RequestDetailsPage › LoadComments On After Fetch (LoadCommentsOnAfterFetch)
         Data source refreshed in its own On After Fetch: refreshes LoadComments inside its own On After Fetch (infinite loop)
```

## Private house design profiles

Teams with an approved visual design can give the skill a **local, private design profile**: put a `PROFILE.md` (plus a theme stylesheet, assets and reference screenshots) in `private/design-profile/` inside the installed skill. Step 0 of `SKILL.md` tells every agent to load it and apply it to all screens and blocks. The `private/` folder is git-ignored and excluded from tests and releases, so client brands never reach the public repository.

## Companion skills

| Skill | Owns |
|---|---|
| [outsystems-architecture](https://github.com/MohamedReda2015/outsystems-architecture) | modules, layers, dependencies, server-side security, deployment |
| [outsystems-live-style-guide](https://github.com/MohamedReda2015/outsystems-live-style-guide) | look and feel: tokens, themes, CSS, patterns, responsive, WCAG, RTL |
| outsystems-backend-conventions | BL use cases, `ActionResult`, exceptions, transactions, integrations |
| outsystems-bpt, outsystems-cmf | processes, task inboxes, case management |
| **outsystems-frontend-conventions** (this one) | how frontend code is written |

Each one works on its own. They cite each other's rule IDs (`HSE-03`, `PERF-08`, `TOK-01`…) instead of repeating them. When installed side by side, a test checks that every cited ID exists.

## Sources
The rules are paraphrased from, and checked against:
- the official OutSystems documentation (its Markdown source is the public [`OutSystems/docs-product`](https://github.com/OutSystems/docs-product) repository), including the TrueChange warnings reference;
- the OutSystems blog and forums, and public community standards (Synobsys);
- lessons from enterprise OutSystems 11 Reactive projects, generalized and anonymized.

The full list, and how each finding changed the skill, is in [`docs/assessment-2026-11.md`](docs/assessment-2026-11.md).

## Development
```bash
npm test     # structure, links, rule IDs, versions, adapter sync, privacy, script behaviour
```
See [CONTRIBUTING.md](CONTRIBUTING.md) for content rules, rule IDs and releases, [SECURITY.md](SECURITY.md) to report problems privately, and [CHANGELOG.md](CHANGELOG.md) for versions.

## License
[MIT](LICENSE). OutSystems names are trademarks of their owner; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
