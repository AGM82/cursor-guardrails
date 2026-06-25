# Cursor Project Guardrails

A portable, opinionated baseline for building production-grade software in Cursor. It encodes a layered guardrail system grounded in Cursor's own agent best practices: plan first, keep written rules thin, and put the real weight into deterministic enforcement an agent cannot bypass.

## Why this exists

Prose rules are _advisory_ — an agent can drift from them after a few turns. Linters, type errors, failing tests, and CI gates are _deterministic_ — they cannot be ignored. Cursor's own guidance is explicit: don't copy style guides into rules, use a linter instead, and reference files rather than their contents. This template follows that — thin rules, heavy enforcement.

## The guardrail tiers

| Tier           | Mechanism                                                                                                                    | Lives in    | Type          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------- |
| 0 — Workflow   | Plan Mode (Shift+Tab); plans saved to `.cursor/plans/`                                                                       | Cursor      | Discipline    |
| 1 — Advisory   | Rules in `.cursor/rules/*.mdc`; cross-tool summary in `AGENTS.md`                                                            | Repo        | Advisory      |
| 2 — Toolchain  | TypeScript strict, ESLint (security + a11y), Prettier, commitlint, tests                                                     | Repo        | Deterministic |
| 3 — Runtime    | Cursor hooks (`.cursor/hooks.json`) gate shell commands and secret-file reads, and audit-log agent activity                  | Repo        | Deterministic |
| 4 — Automation | Pre-commit (husky + lint-staged + gitleaks) and CI (typecheck, lint, test, build, `npm audit`, gitleaks, Semgrep OWASP SAST) | Repo / CI   | Deterministic |
| 5 — Workflows  | Commands in `.cursor/commands/*.md` (`/review`, `/pr`, `/update-deps`)                                                       | Repo        | Workflow      |
| 6 — Review     | Agent Review, Bugbot on PRs, TDD for logic-heavy work                                                                        | Cursor / CI | Safety net    |

## Fundamental vs per-project

**Fundamental — these travel unchanged, do not edit per project:**

- `AGENTS.md` — cross-tool, always-on summary for any agent that reads it
- `.cursor/rules/00-core.mdc` — workflow and non-negotiables
- `.cursor/rules/10-security-popia.mdc` — OWASP + POPIA baseline
- `.cursor/rules/20-commits.mdc` — commit and version conventions
- `.cursor/rules/40-tooling-supply-chain.mdc` — dependency and MCP/supply-chain hygiene
- `.cursor/commands/` — the slash-command workflows
- `.cursor/hooks.json` + `.cursor/hooks/` — runtime guardrails (block destructive shell commands and secret reads; audit log)
- The toolchain and automation layer: `tsconfig.json`, `eslint.config.js`, `.prettierrc.json`, `commitlint.config.js`, `.editorconfig`, `.gitattributes`, `.nvmrc`, `.husky/`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, `.github/CODEOWNERS`
- `CONTRIBUTING.md`

**Per-project — customise these (they carry `<PLACEHOLDER>` markers):**

- `.cursor/rules/90-project-context.mdc` — **the main file you fill in:** what the app is, domain glossary, canonical files, architecture, data classification
- `.cursor/rules/30-react-stack.mdc` — edit only where this project deviates from the default stack
- `SECURITY.md` — the Data classification and Reporting sections
- `.cursorignore` — tune to the project's data and assets
- `LICENSE` + `package.json` `license` field — **choose per project.** The template ships a proprietary "all rights reserved" notice as a safe default; set the right license (proprietary, MIT, etc.) and the correct copyright holder (you, your employer, or another entity) for each project. `package.json` is `private: true` with `license: "UNLICENSED"` to prevent accidental publishing — adjust if you intend to publish.

## Setup

1. Create a repo from this template (GitHub → **Use this template**), or copy these files into your project.
2. `npm install` (installs dependencies and activates the husky hooks). If you use `nvm`, run `nvm use` first to match `.nvmrc`.
3. `npm run typecheck`, `npm run lint`, and `npm run test` to confirm the toolchain resolves (see Notes if a plugin import needs adjusting).
4. Optional: install [gitleaks](https://github.com/gitleaks/gitleaks#installing) for local secret scanning. CI enforces it regardless.
5. Fill in `.cursor/rules/90-project-context.mdc` and the other per-project items above.
6. Commit. Husky, commitlint, and the Cursor hooks are active from the first commit.

This template ships a minimal working React + TypeScript + Vite app (`index.html`, `src/`) with an example component, a pure-function utility, and tests, so `dev`/`build`/`test` work out of the box. Replace it with your real application.

> Note: this template ships dotfiles and dot-directories (`.cursor`, `.github`, `.husky`, `.cursorignore`, etc.). If you unzip it in Finder/Explorer, enable "show hidden files" so you can see them.

## User-level companion rule

The fundamentals here cover any project started from this template. For quick projects that don't, add a short **user-level** rule in Cursor (Settings → Rules) carrying only your universal habits. The text is in `docs/user-level-rule.md`.

## Notes

- **ESLint config** targets ESLint 9 flat config and the major versions in `package.json`. Flat-config plugin exports occasionally change between versions; if `npm run lint` complains about an import, adjust the relevant line in `eslint.config.js`. The toolchain being present and enforced matters more than any single pinned version.
- **Cursor hooks** (`.cursor/hooks.json`) are written in Node so they run cross-platform (Windows/macOS/Linux and cloud agents) with no extra runtime. `guard-shell.mjs` blocks destructive commands and asks on risky ones; `guard-read.mjs` blocks secret-file reads (fail-closed); `audit.mjs` writes a local, git-ignored activity log. Tune the patterns to your environment, and flip `failClosed` on `beforeShellExecution` to `true` for stricter enforcement. Core enforcement still also rests on husky + CI, which run regardless of editor.
- **CI security gates**: the workflow runs gitleaks (secret scanning), Semgrep `p/owasp-top-ten` (SAST), and `npm audit` in addition to typecheck/lint/test/build. gitleaks runs via its public container, so no license key is required.
- **Agent Skills** (`SKILL.md`): once stable for your channel, consider moving repeatable domain workflows (e.g. policy-document generation) into a skill.
- **Third-party rules, skills, and MCP servers** are executable instructions. Read any you import before trusting them, and allowlist MCP servers deliberately in `.cursor/mcp.json` — see `.cursor/rules/40-tooling-supply-chain.mdc`.
