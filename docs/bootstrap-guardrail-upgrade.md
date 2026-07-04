# Bootstrapping guardrail-upgrade on an existing project

The `/guardrail-upgrade` slash command lives inside `.cursor/commands/` — so the
first time you adopt guardrails on a project, that file does not exist yet.
This document gives you three ways to get started — most people only need
Option A.

---

## Option A — Copy-paste prompt (works day zero, nothing to install)

Open your existing project in Cursor. Start a new Agent chat and paste this
block exactly, replacing `TEMPLATE_PATH` with the real path on your machine:

```
Upgrade this project from the cursor-guardrails template.

Template path:
C:\Users\andrewM\OneDrive - Lombard Insurance\Documents\Projects\cursor-guardrails

Follow this workflow:
1. Copy .cursor/commands/ from the template into this project (create the
   folder if it does not exist).
2. Capture a pre-upgrade baseline: run typecheck, lint, build, and test
   (skip any that do not exist). Save output to .cursor/guardrail-baseline.log.
3. Commit everything as: chore: snapshot before guardrail upgrade
4. Ask me 3 quick questions to build a project profile: project type
   (frontend-ui / backend-api / full-stack / library-or-cli /
   script-or-prototype), risk level (Low / Medium / High), and whether I
   already have my own ESLint/Prettier/tsconfig setup. Use
   TEMPLATE_PATH/guardrail-layers.json -> projectProfiles and riskTiers to
   turn my answers into a recommended layer set.
5. Compare both projects and show a gap analysis table by layer, alongside
   the recommended layer set from step 4.
6. Ask me which layers to apply before changing anything.
7. Never overwrite src/, package.json, or tsconfig.json — merge only.
8. After the approved layers: run a code compliance audit (Layer 6) and
   report Blocker / Should-fix / Nit findings. Fix blockers before finishing.
9. Show the Layer 7 governance checklist.
```

This produces the same result as `/guardrail-upgrade` once Layer 1 is installed.

---

## Option B — Copy the commands folder (2 minutes)

Open File Explorer. Copy this folder:

```
C:\Users\andrewM\OneDrive - Lombard Insurance\Documents\Projects\cursor-guardrails\.cursor\commands\
```

Into your existing project at:

```
your-project\.cursor\commands\
```

Create `.cursor\commands\` if it does not exist.

Then in Cursor Agent chat, type:

```
/guardrail-upgrade
```

When asked for the template path, paste:

```
C:\Users\andrewM\OneDrive - Lombard Insurance\Documents\Projects\cursor-guardrails
```

---

## Option C — PowerShell one-liner

From a terminal in your existing project folder:

```powershell
$template = "C:\Users\andrewM\OneDrive - Lombard Insurance\Documents\Projects\cursor-guardrails"
$dest = ".cursor\commands"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item "$template\.cursor\commands\*" $dest -Recurse -Force
Write-Host "Commands bootstrapped. Now type /guardrail-upgrade in Cursor chat."
```

---

## What happens next

After bootstrapping, `/guardrail-upgrade` will:

1. Run a pre-upgrade baseline (saves current typecheck/lint errors)
2. Snapshot git
3. Ask 3 quick project-profile questions (type, risk, existing toolchain)
   and recommend a tailored layer set — not every project needs the same
   layers
4. Compare the project against the template and show a gap analysis
5. Apply approved layers — infrastructure only, never touching your `src/`
6. Run a code compliance audit (Layer 6) against your own code
7. Present a governance activation checklist (Layer 7)

---

## Suggested first-time layer order

There is no single "right" layer order for every project — that is what the
project-profile step (Layer 0.4) is for. As a rule of thumb:

- **Low risk** (prototype, internal script): the profile recommends layers
  `1 2 3` — AI governance, git hygiene, and commit discipline, without
  forcing a full CI pipeline on something that may be thrown away.
- **Medium risk** (a real feature others depend on): the profile recommends
  `1 2 3 4 5` — adds the code-quality toolchain and CI pipeline.
- **High risk** (production, handles data, customer-facing): the profile
  recommends `1 2 3 4 5 6` — adds the code compliance audit before Layer 7
  governance activation.

Reply `all` instead of the recommendation if you are confident the project
has no conflicting ESLint or TypeScript setup and want to apply everything
in one pass.

---

## See also

- Full upgrade command: `.cursor/commands/guardrail-upgrade.md`
- Lessons from a real adoption: `docs/guardrail-upgrade-observations.md`
- User-level rule (universal habits): `docs/user-level-rule.md`
