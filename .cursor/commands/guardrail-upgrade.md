# /guardrail-upgrade

Audit this project against the cursor-guardrails template, present a gap analysis, and — after your confirmation — implement the upgrades layer by layer.

---

## Step 1 — Locate the template

Ask the user: "What is the full path to your cursor-guardrails template folder?"
Example: `C:\Users\me\Projects\cursor-guardrails`

Store this as **TEMPLATE_PATH** for all steps below.

---

## Step 2 — Snapshot the current project

Before touching anything, save the current state so the user can undo if needed:

```
git add -A && git commit -m "chore: snapshot before guardrail upgrade"
```

If the project has no git repo yet, run `git init -b main` first, then the commit above.

---

## Step 3 — Audit: read both sides

Read the following files from TEMPLATE_PATH and from THIS project. For each file, note whether it exists in this project and — if it does — whether it contains the key content sections the template has.

**Layer 1 — AI instructions** (always safe to add; nothing here touches application code)

- `.cursor/rules/00-core.mdc`
- `.cursor/rules/10-security-popia.mdc`
- `.cursor/rules/20-commits.mdc`
- `.cursor/rules/30-react-stack.mdc`
- `.cursor/rules/40-tooling-supply-chain.mdc`
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
- `AGENTS.md`

**Layer 2 — Git hygiene** (safe to add; copy or merge)

- `.gitattributes`
- `.gitignore` — check for key entries: `.env`, `.env.*`, `node_modules/`, `dist/`, `build/`, `coverage/`, `.cursor/hooks/logs/`
- `.nvmrc`
- `.editorconfig`
- `LICENSE`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `.github/CODEOWNERS`
- `.github/dependabot.yml`

**Layer 3 — Commit discipline** (safe; adds tooling without touching source)

- `commitlint.config.js`
- `.husky/pre-commit`
- `.husky/commit-msg`
- `package.json` → `lint-staged` block

**Layer 4 — Code quality toolchain** (merge carefully; may surface existing errors)

- `eslint.config.js`
- `.prettierrc.json`
- `tsconfig.json` — check for strict flags: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`
- `package.json` → `scripts`: `typecheck`, `lint`, `lint:fix`, `format`, `test`
- `package.json` → `engines.node`

**Layer 5 — CI pipeline** (merge carefully; check for existing workflow)

- `.github/workflows/ci.yml` — check for: `secret-scan` job, `sast` job, `npm audit` step, `permissions: contents: read`, `concurrency` block

---

## Step 4 — Present the gap analysis

Show a table with these columns: **Layer | File | Status | Action**

Status values:

- `MISSING` — file does not exist in this project at all
- `OUTDATED` — file exists but is missing key sections the template has
- `CURRENT` — file exists and matches template intent
- `N/A` — not applicable (e.g. project is not Node-based, skip toolchain items)

Group rows by layer. Show a summary line per layer (e.g. "Layer 1: 3 missing, 2 outdated, 11 current").

**Do not make any changes yet.** Ask the user:

> "Which layers would you like to upgrade? Enter layer numbers (e.g. `1 2 3`) or `all`."

---

## Step 5 — Upgrade approved layers

Work through each approved layer in order (1 → 5). For each file:

**If MISSING:**

- Copy the file from TEMPLATE_PATH into this project.
- Files containing `<PLACEHOLDER>` text (`LICENSE`, `90-project-context.mdc`, `CODEOWNERS`, `SECURITY.md`): copy as-is and list all placeholders for the user to fill in after.

**If OUTDATED — config/tooling files** (`package.json`, `eslint.config.js`, `tsconfig.json`, `.husky/pre-commit`, `.github/workflows/ci.yml`):

- Read BOTH versions in full.
- Add only the missing sections to the existing file — do NOT overwrite.
- Preserve all project-specific content.
- Show what you are adding before writing it.

**If OUTDATED — documentation** (`SECURITY.md`, `CONTRIBUTING.md`, `AGENTS.md`):

- Show the user the specific sections that would be added.
- Get confirmation before writing.

After completing each layer, run the following if `package.json` exists:

```
npm run typecheck
npm run lint
```

Report any errors and fix them before moving to the next layer.

---

## Hard rules (never break these)

- Never copy `src/`, `index.html`, `vite.config.ts`, or any application code into a project that already has its own.
- Never overwrite a `.env` file or create one with real values.
- Never remove lines from an existing `.gitignore` — only add.
- Never replace a `tsconfig.json` wholesale — always merge strict settings in.
- Never disable a linter or type rule to silence an error; fix the cause.
- If anything is ambiguous (e.g. the project has a conflicting ESLint setup), stop and ask rather than guessing.
