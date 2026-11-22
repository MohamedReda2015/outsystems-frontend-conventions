# Security policy

This repository contains guidance (Markdown) and two small, zero-dependency Node.js scripts. It has no runtime service.

## Reporting
- **A rule that would lead to insecure OutSystems code** (for example advice that exposes data through a Reactive endpoint or stores secrets on the client): open a GitHub **Security Advisory** (Security → Report a vulnerability) or a normal issue labelled `security`, with the rule ID and the official source.
- **A vulnerability in the scripts** (`scripts/*.mjs`): report it privately through a Security Advisory. Don't open a public issue.
- **Secrets or confidential data committed by mistake**: report it privately right away. Maintainers will remove it and rewrite history if needed.

The scripts only read local files (JavaScript sources or a JSON inventory) and print a report. They make no network calls and never execute the code they analyse.

## Scope
OutSystems platform vulnerabilities are **out of scope**. Report them to OutSystems through their official support and security channels.
