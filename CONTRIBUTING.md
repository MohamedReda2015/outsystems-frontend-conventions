# Contributing

Thanks for helping improve **outsystems-frontend-conventions**. This repository is an agent skill: Markdown that AI agents (and people) read to build and review OutSystems Reactive Web, Mobile and ODC frontends. Every change must stay **accurate, sourced, agent-independent and concise**.

## Ways to contribute
- **Propose a rule**: open a "Rule proposal" issue with the problem, the rule, the severity and a source.
- **Report a wrong or outdated rule**: open a "Bug / inaccuracy" issue and link the official documentation that contradicts it.
- **Add a lesson learned**: a real mistake from a real project, written as *problem → cause → rule*, with no client or personal details.
- **Improve tooling**: the JavaScript linter (`scripts/lint-os-js.mjs`), the inventory checker (`scripts/check-names.mjs`), the tests or the CI workflows.
- **Add an eval case** under `evals/` (a prompt, input files and graders) for behaviour the skill should produce.

## Content rules
1. **Cite sources.** Prefer the official OutSystems documentation; its Markdown source is the public [`OutSystems/docs-product`](https://github.com/OutSystems/docs-product) repository. Community sources (MVP articles, forum answers, public standards) are welcome but lose to official ones. Record what you checked in `docs/assessment-*.md` for larger updates.
2. **Paraphrase, don't copy.** Summarize documentation in your own words; quote at most a short fragment (for example a warning message, abbreviated).
3. **No confidential data.** No client names, internal hostnames, credentials, tokens, phone numbers, personal data or screenshots of private systems. Use neutral examples (`Request_CW`, `RequestList`, `Customer_IS`). A test (`tests/skill.test.mjs`) rejects e-mail addresses and secrets, plus any names you list locally in a git-ignored `.private-names` file (one per line) or the `PRIVATE_NAMES` environment variable.
4. **Explain the reason.** Agents follow rules better when they know *why*. One sentence of reasoning beats an all-caps MUST.
5. **Agent-independent.** Plain Markdown and zero-dependency Node.js scripts. Agent-specific wording belongs only in `adapters/`.
6. **Stay in scope.** Look and feel belong to `outsystems-live-style-guide`; modules, layers and server security to `outsystems-architecture`; server-side logic to `outsystems-backend-conventions`. Cite their rule IDs instead of restating them.
7. **Never commit `private/`.** It holds local house design profiles (client brands, screenshots). Keep it git-ignored; describe only the generic mechanism in public files.
8. **Keep SKILL.md small** (under 300 lines, enforced by a test). Details go into `references/`.

## Rule IDs
- Every enforceable rule lives in `references/review-checklist.md` as `| ID | Rule | Severity | Check |`.
- Groups: `NAM`, `STR`, `BLK`, `NAV`, `LCY`, `FET`, `STA`, `CLG`, `VAL`, `ERR`, `JSC`, `FSC`, `FPF`, `MOB`, `LOC`, `VER`; lessons are `FLL`.
- **IDs are stable.** Never renumber or reuse an ID. New rules take the next free number in their group. To retire a rule, keep the row and mark it *Deprecated*.
- Severity: **Blocker** (security, data loss, broken flows), **Major** (wrong behaviour, missing states, maintainability), **Minor** (convention or hygiene).
- A rule the scripts check must have the same severity in the script's `RULES` table and in the checklist (a test enforces this for `JSC`).
- If a built-in TrueChange or Code Quality warning covers the rule, add it to the warning map at the end of the checklist.

## Script changes
- Standard library only; Node.js 18 or later; no network access; no execution of the code being linted.
- Every new check gets a positive and a negative case in `tests/scripts.test.mjs`, and an example under `scripts/examples/` where it helps.
- Keep suppressions explicit and reasoned: `// jsc-ignore JSC-xx: reason` for JS, `"ignore": ["ID: reason"]` in inventories.

## Before you open a pull request
```
npm test                                                   # structure, links, rule IDs, versions, privacy, scripts
node scripts/lint-os-js.mjs scripts/examples/js            # bad examples fail, good ones pass
node scripts/check-names.mjs scripts/examples/inventory/good-request-cw.json
```
- Update `CHANGELOG.md` (under *Unreleased*, or a new version).
- For a release, bump `metadata.version` in `SKILL.md` **and** `version` in `package.json` (semantic versioning: new rules = minor, wording fixes = patch, a changed meaning of existing IDs = major), then push a tag `vX.Y.Z`. The release workflow checks both versions and the changelog section, then attaches the installable zips.
- If you changed `adapters/core-rules.md`, copy the same text into the marked block of `adapters/copilot-instructions.md` (a test compares them).

## Reliability review guidance

Use `FRV` for verification and reliability review rules. These are manual acceptance checks unless a script explicitly implements them. Keep platform facts, house conventions and observed project lessons distinct, and link primary sources from `references/verification-and-reliability.md`.

## Code of conduct
By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
