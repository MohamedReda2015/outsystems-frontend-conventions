# Changelog

## Unreleased — cross-skill delivery review (2026-11-22)

- Connected requirements, domain implementation and runtime evidence through stable IDs and versioned handoffs.
- Added domain acceptance guidance, template evidence fields and sourced review checks.


## Unreleased — reliability review (2026-11-22)

- Clarified platform facts versus house/project conventions and verification evidence.
- Added domain-specific reliability guidance, source provenance and acceptance cases.
- Added review/template checks and corrected over-broad or inconsistent claims.
- Extended repository consistency checks to the new reliability rule IDs and aligned contributor guidance with the full checkout.


All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/). The version is also in the `metadata.version` field of `SKILL.md`.

## [Unreleased]

## [1.1.0] - 2026-11-22
Research update. Sources: the official OutSystems documentation (read from the public `OutSystems/docs-product` repository), the TrueChange warnings reference, the OutSystems blog, the Synobsys public standards, OutSystems forum threads, and the companion skills. Full findings and sources: `docs/assessment-2026-11.md`.

### Changed
- **Lifecycle** rewritten against the official page: documented order (blocks' OnReady/OnRender before the parent's, OnParametersChanged outer → nested, OnDestroy top-down), coexisting screen DOMs during navigation, no local storage in OnInitialize, On After Fetch data not yet bound, guarded one-time OnRender flag (official "prioritize content" pattern), fetch chains merged into one data action.
- **JavaScript**: corrected: dynamic styling goes through Style Classes expressions, not JS class toggling (official mobile best practices). Added the official async model (`$resolve()` takes no arguments, promises from async actions, mandatory error handling), public JS API only (`$public` modules table, `$roles`, `$public.Logger`), Script elements and their load order, `EncodeJavaScript()`/`EncodeHtml()`/`EncodeUrl()`, CSP without `unsafe-eval`/`unsafe-inline`, no DOM-manipulating libraries.
- **ActionResult** aligned with outsystems-backend-conventions: `{IsSuccess, Message, Code, Errors[Field, Code, Message]}` with data as separate outputs; the UI branches on `Code`, because custom exception types don't reliably cross Service Actions.
- **Errors**: how the platform routes exceptions (Global Exception Handler property, block exceptions handled by the consuming screen's flow, no public handlers in Reactive, OnApplicationReady not covered, `$reject`).
- **Data and security**: every client-used aggregate/data action/server action is a REST endpoint; server-to-client data optimization (PS 11.12+); `GetUserId()` inside aggregates; client variables are shared across apps; menus from the server; one screen per role profile.
- **Naming**: dates and constants; Synobsys conventions documented as an accepted project alternative.
- Companion skills now include outsystems-backend-conventions, outsystems-bpt and outsystems-cmf.

### Added
- Rules LCY-07, FET-06, VAL-07, VAL-08, ERR-06, JSC-16…19, FSC-06, FSC-07, FPF-04, FPF-05, MOB-06, MOB-07 (105 rules in total).
- A **TrueChange / Code Quality warning → rule** mapping table in the review checklist.
- Lessons FLL-20…25 from the research.
- `lint-os-js.mjs`: JSC-16 (promise without catch, `$resolve(value)`), JSC-17 (internal APIs), JSC-18 (large node), JSC-19 (JS class toggling).
- `check-names.mjs`: lifecycle wiring (FET-01, LCY-01, LCY-03, LCY-07), several server calls per action (CLG-01), entity actions from the client (FSC-06), splash data sources (MOB-06), `--handlers on-prefix` and `--block-suffix` for the Synobsys style.
- Mobile: lightweight local storage, chunked sync, `TriggerOfflineDataSync`, plugin fallbacks, client-side log, infinite-scroll tuning.
- `docs/assessment-2026-11.md`.
- Public-repository files: CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, THIRD_PARTY_NOTICES (OutSystems trademark and documentation notice), issue forms (bug/inaccuracy, rule proposal), pull request template, and a README with install, quick start and tool examples.

## [1.0.0] - 2026-11-22
First release. Built as the frontend-development companion to `outsystems-live-style-guide` (look and feel) and `outsystems-architecture` (layers and server rules), from their rules and from lessons learned on several enterprise OutSystems 11 Reactive projects.

### Added
- `SKILL.md`: Step 0 context, precedence, ten core conventions, how to build, review and refactor, most-broken rules, and a reference map.
- References: naming and structure; screens and blocks (block contracts, popups, navigation, reuse); lifecycle and events; data fetching and state; client logic, forms, validation, errors and feedback; JavaScript; frontend security, performance, Mobile/offline and multilingual; lessons learned (FLL-01…19); a review checklist with 90+ rule IDs (NAM, STR, BLK, NAV, LCY, FET, STA, CLG, VAL, ERR, JSC, FSC, FPF, MOB, LOC, VER).
- `scripts/lint-os-js.mjs`: linter for OutSystems JavaScript nodes (JSC-01…15), with cleanup checks across a block's nodes, reasoned suppressions and JSON output.
- `scripts/check-names.mjs`: checker for a JSON module inventory (naming, contracts, screen parameters, roles, titles, client variables, block size).
- Templates: block contract, frontend review report, JavaScript node header.
- Adapters: compact core rules, AGENTS.md, Cursor rule, Copilot instructions.
- Tests (`npm test`), CI on Node 22 and 24, and a tag-driven release workflow.
