# Contributing

## Prerequisites

- Node.js (version pinned in `.nvmrc`; currently **22**, with `package.json` `engines.node` requiring `>=22.12.0`). If you use `nvm` or `fnm`, run `nvm use` / `fnm use` so PATH matches `.nvmrc` — a standalone older 22.x (e.g. 22.11.0) will fail `npm run check:runtime` and can skip Rolldown native bindings on install.
- npm (ships with Node).
- Optional but recommended: [gitleaks](https://github.com/gitleaks/gitleaks#installing) for local secret scanning. CI enforces it regardless; local install gives faster feedback.
- Optional but recommended: [gh CLI](https://cli.github.com) enables the `/pr` slash command to open pull requests from the terminal. Install on Windows: `winget install --id GitHub.cli`.

> **Windows PowerShell note:** PowerShell does not support the `&&` command separator. Run chained commands on separate lines, or use `;` between them.

## Setup

```bash
npm install
npm run check:runtime
```

This installs dependencies and activates the Git hooks (husky). `check:runtime` confirms Node satisfies `engines.node` / `.nvmrc` and that the platform Rolldown native binding is present after install.

## Day-to-day commands

| Command                 | What it does                                                |
| ----------------------- | ----------------------------------------------------------- |
| `npm run dev`           | Start the local dev server                                  |
| `npm run build`         | Production build (typecheck + bundle)                       |
| `npm run typecheck`     | TypeScript, no emit                                         |
| `npm run lint`          | ESLint                                                      |
| `npm run check:runtime` | Verify Node version + Rolldown native binding after install |
| `npm run test`          | Run the test suite once                                     |
| `npm run test:watch`    | Run tests in watch mode                                     |
| `npm run format`        | Format with Prettier                                        |

A change is ready when `npm run check:runtime`, `npm run typecheck`, `npm run lint`, and `npm run test` all pass.

## Troubleshooting

### `Cannot find module '@rolldown/binding-…'` or mysterious Vitest/Vite startup failures

npm may skip optional native bindings when Node is outside the toolchain engine range (`^20.19.0 || >=22.12.0` for Vite/Rolldown). A common Windows failure mode is a broken Node manager / PATH preferring a standalone **22.11.0** while `.nvmrc` says **22**.

1. Fix the active Node (`fnm use` / `nvm use` / install Node **≥22.12.0**).
2. Remove `node_modules` and reinstall: `rm -rf node_modules` then `npm ci` (or `npm install`).
3. Run `npm run check:runtime` — it should pass before you retry tests.
4. Do **not** “fix” this by blindly bumping Vite/Vitest or deleting tests.

### jsdom / `ERR_REQUIRE_ESM` / `@exodus/bytes`

jsdom 27+ can pull `html-encoding-sniffer` → ESM-only `@exodus/bytes` loaded via `require()`, which breaks Vitest’s jsdom environment in some setups. This template pins `jsdom` to `^26.1.0` until that failure class is resolved upstream. Do not float jsdom to 27+/29 without an intentional pin change and a re-test of `npm run test`.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): subject`
(e.g. `feat(schedule): add ZAR premium breakdown`). `commitlint` enforces this on commit.
See `.cursor/rules/20-commits.mdc`.

## What runs automatically

- **On commit (husky):** secret scan (gitleaks, if installed) + `lint-staged` (ESLint + Prettier on staged files), and a commit-message check.
- **In the Cursor agent (hooks):** `.cursor/hooks/` block destructive shell commands and reads of secret files, and log activity.
- **In CI (GitHub Actions):** `check:runtime`, typecheck, lint, test, build, `npm audit`, gitleaks secret scan, and a Semgrep OWASP SAST scan.

## Pull requests

Fill in the PR template. PRs must pass all CI checks. `CODEOWNERS` controls who reviews what — update it with your real team handles.

## Secret-scan false positives

If gitleaks flags a non-secret, add a `gitleaks.toml` allowlist entry (path or regex) rather than disabling the scan. Never commit real secrets to "test" the scanner.
