# Cursor Project Guardrails

A portable, opinionated baseline for building production-grade software in Cursor. It encodes a layered guardrail system grounded in Cursor's own agent best practices: plan first, keep written rules thin, and put the real weight into deterministic enforcement an agent cannot bypass.

**Live hub:** [github.com/AGM82/cursor-guardrails](https://github.com/AGM82/cursor-guardrails) — playbook, Throughline contracts, scheduled AI reviews, reference clone for `/guardrail-upgrade`.

**New projects:** use the thin starter — [github.com/AGM82/cursor-guardrails-starter](https://github.com/AGM82/cursor-guardrails-starter) → **Use this template**. Do **not** generate from this hub repo (it ships hub-only playbook/Throughline/AI-review scaffolding).

## Why this exists

Prose rules are _advisory_ — an agent can drift from them after a few turns. Linters, type errors, failing tests, and CI gates are _deterministic_ — they cannot be ignored. Cursor's own guidance is explicit: don't copy style guides into rules, use a linter instead, and reference files rather than their contents. This template follows that — thin rules, heavy enforcement.

## The guardrail tiers

| Tier           | Mechanism                                                                                                                                                                                            | Lives in    | Type          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------- |
| 0 — Workflow   | Plan Mode (Shift+Tab); plans saved to `.cursor/plans/`                                                                                                                                               | Cursor      | Discipline    |
| 1 — Advisory   | Rules in `.cursor/rules/*.mdc`; cross-tool summary in `AGENTS.md`                                                                                                                                    | Repo        | Advisory      |
| 2 — Toolchain  | TypeScript strict, ESLint (security + a11y), Prettier, commitlint, tests                                                                                                                             | Repo        | Deterministic |
| 3 — Runtime    | Cursor hooks (`.cursor/hooks.json`) gate shell commands and secret-file reads, and audit-log agent activity                                                                                          | Repo        | Deterministic |
| 4 — Automation | Pre-commit (husky + lint-staged + gitleaks) and CI (typecheck, lint, test, build, `npm audit` + signature verification, SBOM generation, build provenance attestation, gitleaks, Semgrep OWASP SAST) | Repo / CI   | Deterministic |
| 5 — Workflows  | Commands in `.cursor/commands/*.md` (`/review`, `/audit`, `/pr`, `/update-deps`, `/guardrail-upgrade`)                                                                                               | Repo        | Workflow      |
| 6 — Review     | Agent Review, Bugbot on PRs, TDD for logic-heavy work                                                                                                                                                | Cursor / CI | Safety net    |

## Fundamental vs per-project

**Fundamental — these travel unchanged, do not edit per project:**

- `AGENTS.md` — cross-tool, always-on summary for any agent that reads it
- `.cursor/rules/00-core.mdc` — workflow and non-negotiables
- `.cursor/rules/10-security-popia.mdc` — OWASP + POPIA baseline
- `.cursor/rules/20-commits.mdc` — commit and version conventions
- `.cursor/rules/40-tooling-supply-chain.mdc` — dependency and MCP/supply-chain hygiene
- `.cursor/commands/` — the slash-command workflows
- `.cursor/hooks.json` + `.cursor/hooks/` — runtime guardrails (block destructive shell commands and secret reads; audit log)
- The toolchain and automation layer: `tsconfig.json`, `eslint.config.js`, `.prettierrc.json`, `commitlint.config.mjs`, `.editorconfig`, `.gitattributes`, `.nvmrc`, `.husky/`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, `.github/CODEOWNERS`
- `CONTRIBUTING.md`

**Per-project — customise these (they carry `<PLACEHOLDER>` markers):**

- `.cursor/rules/90-project-context.mdc` — **the main file you fill in:** what the app is, domain glossary, canonical files, architecture, data classification
- `.cursor/rules/30-react-stack.mdc` — edit only where this project deviates from the default stack
- `SECURITY.md` — the Data classification and Reporting sections
- `.cursorignore` — tune to the project's data and assets
- `LICENSE` + `package.json` `license` field — **choose per project.** The template ships a proprietary "all rights reserved" notice as a safe default; set the right license (proprietary, MIT, etc.) and the correct copyright holder (you, your employer, or another entity) for each project. `package.json` is `private: true` with `license: "UNLICENSED"` to prevent accidental publishing — adjust if you intend to publish.

## Setup (new project)

1. Create a repo from the **starter** (GitHub → [cursor-guardrails-starter](https://github.com/AGM82/cursor-guardrails-starter) → **Use this template**). Do not use **Use this template** on _this_ hub repo.
2. `npm install` (installs dependencies and activates the husky hooks). If you use `nvm` / `fnm`, run `nvm use` / `fnm use` first so PATH matches `.nvmrc` (Node **22**, `engines.node` `>=22.12.0`).
3. `npm run check:runtime`, then `npm run typecheck`, `npm run lint`, and `npm run test` to confirm the toolchain resolves (see Notes if a plugin import needs adjusting).
4. Optional: install [gitleaks](https://github.com/gitleaks/gitleaks#installing) for local secret scanning. CI enforces it regardless.
5. Fill in `.cursor/rules/90-project-context.mdc` and the other per-project items above.
6. Replace the demo under `src/` with your product. Commit. Husky, commitlint, and the Cursor hooks are active from the first commit.
7. On GitHub: enable branch protection on `main` (see **Branch protection** below).
8. To receive future guardrail improvements, keep a separate **reference clone** of **this hub** (`git clone https://github.com/AGM82/cursor-guardrails` — a plain clone, not "Use this template") and run `/guardrail-upgrade` inside your project later.

The starter ships a minimal React + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui demo so `dev`/`build`/`test` work out of the box. Canonical demo files are listed in `90-project-context.mdc` — replace them with your product's canonicals.

**Already generated from this fat hub before the split?** See [`docs/post-generate-cleanup.md`](docs/post-generate-cleanup.md). **Stack adaptations (Next.js, High-risk B2B):** [`docs/consumer-adaptations.md`](docs/consumer-adaptations.md).

## Existing project? Start here

Adopt the guardrails incrementally without touching your application code.

**You'll need a reference clone:** a plain `git clone https://github.com/AGM82/cursor-guardrails`, kept anywhere outside the project you're upgrading — not GitHub's "Use this template" button, which is only for starting a brand-new project (see **Setup (new project)** above) and creates a disconnected copy with no upstream link. The agent reads from this reference clone and refreshes it automatically (`git pull --ff-only`) before every run.

**Quick start (day zero, nothing to copy):** Open the project in Cursor, start an Agent chat, and paste the bootstrap prompt from [`docs/bootstrap-guardrail-upgrade.md`](docs/bootstrap-guardrail-upgrade.md). The agent will copy the command files, capture a baseline, and walk you through the gap analysis.

**Need a documented risk tier or governance evidence instead of the self-serve profile questions?** See [`docs/connect-guardrails.md`](docs/connect-guardrails.md) for adopting via Throughline (or another governance tool) instead.

**Once `.cursor/commands/` is in place**, use `/guardrail-upgrade` in Agent chat for all future runs.

**Recommended first-adoption order:**

| Step                 | What happens                                               |
| -------------------- | ---------------------------------------------------------- |
| 0 — Bootstrap        | Copy `.cursor/commands/` from the template                 |
| 0.5 — Baseline       | Capture current typecheck/lint errors before any changes   |
| 0.6 — Snapshot       | `git commit` an undo point                                 |
| 1–3 — Safe layers    | AI rules, git hygiene, commit discipline — no code touched |
| 4–5 — Toolchain + CI | Merge carefully; may surface pre-existing errors           |
| 6 — Code audit       | Align existing code with installed rules; fix blockers     |
| 7 — Governance       | Enable branch protection, confirm PR-only workflow         |

**Key guarantees the command enforces:**

- Captures a baseline _before_ changes so you know which errors already existed.
- Never overwrites `src/`, `.env`, or your `tsconfig.json` wholesale.
- Never removes lines from `.gitignore`.
- Stops and asks if anything is ambiguous.

See [`docs/guardrail-upgrade-observations.md`](docs/guardrail-upgrade-observations.md) for lessons learned from a real adoption, and [`docs/worked-example-africa-risk-map.md`](docs/worked-example-africa-risk-map.md) for the hub/starter split that followed.

**Template versioning:** after a successful upgrade, a `.cursor/guardrail-version` file is written to track which template release was applied. Future runs flag layers that have drifted. Tag your own template releases as `guardrail-v1.1.0` on GitHub to participate in this system.

**Machine-readable layer model:** [`guardrail-layers.json`](./guardrail-layers.json) at the repo root encodes the adoption-layer model and risk-tier mapping as a versioned artefact. Downstream governance tools (such as Throughline) vendor this file and receive automatic refresh PRs when it changes. See [`docs/guardrail-layers.md`](./docs/guardrail-layers.md) for the consumption pattern and schema reference.

**Connecting to Throughline (or another governance tool):** if a project needs a documented risk tier and governance evidence rather than the self-serve 3-question profile, see [`docs/connect-guardrails.md`](./docs/connect-guardrails.md) for the direct-vs-Throughline decision and step-by-step for both, and [`docs/project-lifecycle.md`](./docs/project-lifecycle.md) for the full build-and-maintain lifecycle this fits into.

## GitHub template (maintainers)

**Consumer starter (`cursor-guardrails-starter`):**

1. Create the public repo once; enable **Template repository**.
2. Add hub secret `STARTER_SYNC_TOKEN` (fine-grained PAT: Contents + Pull requests on the starter).
3. Run **Sync starter template** (Actions) after each guardrail version bump — opens a sync PR on the starter.

**This hub:** keep as a normal (non-template) repo, or leave template enabled only for emergency clones — new products should use the starter. Playbook hosting and AI-review workflows stay here.

## Branch protection (recommended)

After the first green CI run on `main`:

1. **Settings → Branches → Add branch ruleset**
2. Name: `main protection` · Enforcement: **Active** · Target: `main`
3. Tick: Restrict deletions, Block force pushes, Require a pull request before merging, Require status checks to pass
4. Required checks (add all three):
   - `Typecheck, lint, test, build`
   - `Secret scan (gitleaks)`
   - `SAST (Semgrep OWASP Top Ten)`
5. Save

On a free personal account, rulesets enforce on **public** repos. Confirm CI is green under **Actions** before selecting checks.

> Note: this template ships dotfiles and dot-directories (`.cursor`, `.github`, `.husky`, `.cursorignore`, etc.). If you unzip it in Finder/Explorer, enable "show hidden files" so you can see them.

## User-level companion rule

The fundamentals here cover any project started from this template. For quick projects that don't, add a short **user-level** rule in Cursor (Settings → Rules) carrying only your universal habits. The text is in `docs/user-level-rule.md`.

## Notes

- **ESLint config** targets ESLint 9 flat config and the major versions in `package.json`. Flat-config plugin exports occasionally change between versions; if `npm run lint` complains about an import, adjust the relevant line in `eslint.config.js`. The toolchain being present and enforced matters more than any single pinned version.
- **Cursor hooks** (`.cursor/hooks.json`) are written in Node so they run cross-platform (Windows/macOS/Linux and cloud agents) with no extra runtime. `guard-shell.mjs` blocks destructive commands and asks on risky ones; `guard-read.mjs` blocks secret-file reads (fail-closed); `audit.mjs` writes a local, git-ignored activity log. Tune the patterns to your environment, and flip `failClosed` on `beforeShellExecution` to `true` for stricter enforcement. Core enforcement still also rests on husky + CI, which run regardless of editor.
- **CI security gates**: the workflow runs gitleaks (secret scanning), Semgrep `p/owasp-top-ten` (SAST), and `npm audit` in addition to typecheck/lint/test/build. gitleaks runs via its public container, so no license key is required.
- **Agent Skills** (`SKILL.md`): once stable for your channel, consider moving repeatable domain workflows (e.g. policy-document generation) into a skill.
- **Third-party rules, skills, and MCP servers** are executable instructions. Read any you import before trusting them, and allowlist MCP servers deliberately in `.cursor/mcp.json` — see `.cursor/rules/40-tooling-supply-chain.mdc`.
