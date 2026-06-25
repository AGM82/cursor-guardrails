# Agent instructions

Cross-tool entry point for AI coding agents (Cursor Agent, and others that read
`AGENTS.md`). Keep this short and action-oriented. The detailed, scoped rules
live in `.cursor/rules/*.mdc`; this file is the always-on summary.

## Commands

- `npm run dev` — local dev server
- `npm run build` — production build (typecheck + bundle)
- `npm run typecheck` — TypeScript, no emit
- `npm run lint` — ESLint
- `npm run test` — test suite (Vitest)

## Slash commands (type in Cursor chat)

- `/review` — run checks and review staged changes; report by severity before fixing anything
- `/pr` — confirm checks pass, write a Conventional Commit, push, and open a pull request
- `/update-deps` — update dependencies one at a time, re-testing after each
- `/guardrail-upgrade` — compare an existing project against this template, show a gap analysis by layer, and implement approved upgrades

## Verify before you finish

After a series of edits, run `npm run typecheck`, `npm run lint`, and
`npm run test`. A task is not done until all three pass. Do not modify tests to
make failing code pass, and do not disable a lint/type rule to silence an error
— fix the cause.

## How to work

- Plan before non-trivial changes; get the plan approved before writing code.
- Make the smallest change that satisfies the requirement. Search for existing
  patterns and extend them before inventing new ones.
- Use only what you can verify: files you have read, the user's instructions,
  and tool results. If information is missing, search, then ask.

## Hard stops

- No secrets, credentials, or real client/personal data in source, logs, or
  commits. Secrets come from environment variables; `.env` is git-ignored.
- Validate input at every trust boundary; use parameterised queries only.
- Never log personal information. Flag any new field that could be personal
  information in the plan before implementing it.

## Where things are

- Working rules: `.cursor/rules/00-core.mdc`
- Security & POPIA: `.cursor/rules/10-security-popia.mdc`
- Commits (Conventional Commits): `.cursor/rules/20-commits.mdc`
- Frontend stack: `.cursor/rules/30-react-stack.mdc`
- Tooling & supply chain: `.cursor/rules/40-tooling-supply-chain.mdc`
- Project specifics (fill this in): `.cursor/rules/90-project-context.mdc`

> Keep this file in sync with `.cursor/rules/00-core.mdc`. If the two ever
> disagree, the rule files are authoritative for Cursor; this file is what
> other tools read.
