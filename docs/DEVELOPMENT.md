# Money OS Development Workflow

## Default shipping model

Money OS is a fast-moving product repository. Small, coherent changes are committed directly to `main` by authorized maintainers rather than creating a pull request for every change.

Pull requests remain available for major architectural changes, external contributors, security-sensitive review, or changes that genuinely benefit from parallel review. They are not the default delivery mechanism.

## Guardrails

Direct-to-main does not mean skip verification.

Before calling a change complete:

1. Inspect the existing implementation and its consumers.
2. Make the smallest coherent change.
3. Run or reason through type checks and tests locally when the environment permits.
4. Push the change to `main`.
5. Let GitHub Actions verify the pushed commit.
6. Inspect failures before starting the next dependent feature.

When local network access is unavailable, do not claim a local build was run. Use repository inspection plus CI as the verification loop.

## Financial-code rule

Financial calculations, state transitions, authorization, and settlement logic must remain deterministic and independently testable. AI and UI code must not become authoritative sources of financial state.

## Commit discipline

Prefer focused commits such as:

- `fix: ...`
- `feat: ...`
- `test: ...`
- `docs: ...`
- `refactor: ...`

A sequence of direct commits is preferable to a queue of abandoned pull requests when the work is being performed by the repository maintainer.
