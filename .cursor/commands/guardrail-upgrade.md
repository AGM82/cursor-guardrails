# /guardrail-upgrade

Audit this project against the cursor-guardrails template, present a gap analysis by layer, and — after confirmation — implement the upgrades. Covers Layers 0–7: bootstrap through governance.

---

## Layer 0 — Bootstrap (run first, always)

Check whether this project already has `.cursor/commands/guardrail-upgrade.md`.

**If it is missing** (first-time adoption):

1. Ask the user: "What is the full path to your cursor-guardrails template folder?"
   Example: `C:\Users\me\Projects\cursor-guardrails`
2. Copy the entire `.cursor/commands/` folder from `TEMPLATE_PATH` into this project's `.cursor/commands/`. Create `.cursor/commands/` if it does not exist.
3. Confirm: "Commands folder bootstrapped. Continuing upgrade…"

**If it already exists**, ask for `TEMPLATE_PATH` and continue.

Store this as **TEMPLATE_PATH** for all steps below.

> **Windows PowerShell note:** Run commands separately if `&&` fails. Replace `cmd1 && cmd2` with two separate lines.

---

## Layer 0.5 — Pre-upgrade baseline

Before any changes, capture the current state of the project:

Run (skip any script that does not exist in `package.json`):

```
npm run typecheck
npm run lint
npm run build
npm run test
```

Save the output to `.cursor/guardrail-baseline.log` (this file is gitignored — it stays local).

If there is no `package.json`, note that and skip this step.

This baseline lets you distinguish errors the guardrails introduced from errors that already existed.

---

## Layer 0.6 — Snapshot git

Save a safe undo point before making any changes:

```
git add -A
git commit -m "chore: snapshot before guardrail upgrade"
```

If this project has no git repo yet:

```
git init -b main
git add -A
git commit -m "chore: initial commit before guardrails"
```

---

## Layer 1–5 — Audit: read both sides

Read the following files from TEMPLATE_PATH and from THIS project. For each file, note whether it exists here and — if it does — whether it contains the key content the template has.

**Layer 1 — AI instructions** (always safe to add; nothing here touches application code)

> The canonical file list for Layer 1 is maintained in `guardrail-layers.json` at the template root under `adoptionLayers["1"].files`. The list below is the human-readable reference; if they ever diverge, the JSON is authoritative.

- `.cursor/rules/00-core.mdc`
- `.cursor/rules/10-security-popia.mdc`
- `.cursor/rules/20-commits.mdc`
- `.cursor/rules/30-react-stack.mdc`
- `.cursor/rules/31-design.mdc`
- `.cursor/rules/32-ux-behavioural.mdc`
- `.cursor/rules/33-data-science.mdc`
- `.cursor/rules/40-tooling-supply-chain.mdc`
- `.cursor/rules/50-ai-tooling.mdc`
- `.cursor/rules/60-backend-api.mdc` (only relevant once the project has a server/API — safe to add regardless, it is glob-scoped and inert otherwise)
- `.cursor/rules/61-database.mdc` (only relevant once the project has a database)
- `.cursor/rules/62-deployment-observability.mdc` (only relevant once the project deploys somewhere beyond local)
- `.cursor/rules/90-project-context.mdc`
- `.cursor/commands/review.md`
- `.cursor/commands/pr.md`
- `.cursor/commands/update-deps.md`
- `.cursor/commands/guardrail-upgrade.md`
- `.cursor/hooks.json`
- `.cursor/hooks/guard-shell.mjs`
- `.cursor/hooks/guard-read.mjs`
- `.cursor/hooks/audit.mjs`
- `.cursor/mcp.json`
- `.cursorignore`
- `AGENTS.md`

**Layer 2 — Git hygiene** (safe to add; copy or merge)

- `.gitattributes`
- `.gitignore` — check for: `.env`, `.env.*`, `node_modules/`, `dist/`, `build/`, `coverage/`, `.cursor/hooks/logs/`
- `.nvmrc`
- `.npmrc`
- `.editorconfig`
- `LICENSE`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `.github/CODEOWNERS`
- `.github/dependabot.yml` — check for: `react-runtime` group, ESLint ecosystem major-bump ignores
- `.github/pull_request_template.md`

**Layer 3 — Commit discipline** (safe; adds tooling without touching source)

- `commitlint.config.mjs` (note: `.mjs`, not `.js`)
- `.husky/pre-commit`
- `.husky/commit-msg`
- `package.json` → `lint-staged` block

**Layer 4 — Code quality toolchain** (merge carefully; may surface existing errors)

- `eslint.config.js` / `eslint.config.mjs` — verify `.cursor/**` is in `ignores`/`globalIgnores`
- `.prettierrc.json`
- `tsconfig.json` — check for strict flags: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`
- `package.json` → scripts: `typecheck`, `lint`, `lint:fix`, `format`, `test`
- `package.json` → `engines.node`

**Layer 5 — CI pipeline** (merge carefully; check for existing workflow)

- `.github/workflows/ci.yml` — check for: `secret-scan` job, `sast` job, `sbom` job, `npm audit` step, `npm audit signatures` step, `attest-build-provenance` step, `permissions: contents: read`, `concurrency` block

---

## Present gap analysis

Show a table with these columns: **Layer | File | Status | Action**

Status values:

- `MISSING` — file does not exist in this project at all
- `OUTDATED` — file exists but is missing key sections the template has
- `CURRENT` — file exists and matches template intent
- `N/A` — not applicable (e.g. project is not Node-based)

Group rows by layer. Show a summary line per layer (e.g. "Layer 1: 3 missing, 2 outdated, 11 current").

**Do not make any changes yet.** Ask the user:

> "Which layers would you like to upgrade? Enter layer numbers (e.g. `1 2 3`) or `all`. For a first adoption, `all` is recommended."

---

## Upgrade approved layers (1–5)

Work through each approved layer in order. For each file:

**If MISSING:**

- Copy the file from TEMPLATE_PATH into this project.
- Files containing `<PLACEHOLDER>` text (`LICENSE`, `90-project-context.mdc`, `CODEOWNERS`, `SECURITY.md`): copy as-is and list all placeholders for the user to fill in after.

**If OUTDATED — config/tooling files** (`package.json`, `eslint.config.*`, `tsconfig.json`, `.husky/pre-commit`, `.github/workflows/ci.yml`, `.github/dependabot.yml`):

- Read BOTH versions in full.
- Add only the missing sections — do NOT overwrite.
- Preserve all project-specific content.
- Show what you are adding before writing it.

**If OUTDATED — documentation** (`SECURITY.md`, `CONTRIBUTING.md`, `AGENTS.md`):

- Show the user the specific sections that would be added.
- Get confirmation before writing.

After completing each layer, run (skip any that do not exist in `package.json`):

```
npm run typecheck
npm run lint
```

Report any errors and fix them before moving to the next layer.

---

## Layer 6 — Code compliance audit (required for existing projects)

This layer is not about files from the template — it is about aligning the **project's own code** with the rules just installed.

1. Run all checks and compare against `.cursor/guardrail-baseline.log`:

   ```
   npm run typecheck
   npm run lint
   npm run build
   ```

   Identify which errors existed before (in baseline) vs which are new (introduced by guardrails).

2. Audit `src/`, `app/`, or the project's main source directories against:
   - `.cursor/rules/90-project-context.mdc` — domain language, canonical patterns, architecture constraints
   - `.cursor/rules/10-security-popia.mdc` — input validation, secrets, personal data logging
   - `.cursor/rules/30-react-stack.mdc` — if this is a UI project

3. Output a findings table:

   | Severity       | Finding                             | File | Line |
   | -------------- | ----------------------------------- | ---- | ---- |
   | **Blocker**    | Must fix before upgrade is complete |      |      |
   | **Should-fix** | Fix soon; not a merge blocker       |      |      |
   | **Nit**        | Polish; can be deferred             |      |      |

4. Fix all **Blocker** findings. Confirm with the user before starting.

5. Re-run checks. Commit when clean:
   ```
   git add -A
   git commit -m "fix: align existing code with guardrails (Layer 6)"
   ```

> Use `/review` for the same severity-grouped analysis on individual changesets.

---

## Layer 7 — Governance activation

Human steps — confirm these are done before declaring the upgrade complete:

- [ ] Branch protection is enabled on `main` (Settings → Branches → ruleset with three required checks)
- [ ] The next change to this project will go via a feature branch + PR, not a direct push to `main`
- [ ] Open Dependabot PRs have been reviewed individually; any grouped PR that fails CI has been closed
- [ ] `gh` CLI is installed (optional but enables `/pr`): `winget install --id GitHub.cli` or see [cli.github.com](https://cli.github.com)
- [ ] `gitleaks` is installed locally for pre-commit parity with CI (optional; CI enforces it regardless)

---

## Record upgrade version

After completing all approved layers, write the applied template version to this project.
Read the current template version from `TEMPLATE_PATH/.cursor/guardrail-version` (also mirrored in
`TEMPLATE_PATH/guardrail-layers.json` → `guardrailVersion`) — do not hardcode a version number, it will
always go stale. Write that exact value into this project's `.cursor/guardrail-version`:

```
cat TEMPLATE_PATH/.cursor/guardrail-version > .cursor/guardrail-version
```

Add `.cursor/guardrail-version` to this project's git tracking if it is not already tracked:

```
git add .cursor/guardrail-version
git commit -m "chore: record guardrail template version"
```

On future runs, `/guardrail-upgrade` compares this file against `TEMPLATE_PATH/.cursor/guardrail-version` to identify drift.

---

## Hard rules (never break these)

- Never copy `src/`, `index.html`, `vite.config.ts`, or any application code into a project that already has its own.
- Never overwrite a `.env` file or create one with real values.
- Never remove lines from an existing `.gitignore` — only add.
- Never replace a `tsconfig.json` wholesale — always merge strict settings in.
- Never disable a linter or type rule to silence an error; fix the cause.
- If anything is ambiguous (e.g. the project has a conflicting ESLint setup), stop and ask rather than guessing.
- Do not declare the upgrade complete if any Blocker findings from Layer 6 remain unresolved.
