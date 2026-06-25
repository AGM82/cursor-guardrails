# Bootstrapping guardrail-upgrade on an existing project

The `/guardrail-upgrade` slash command lives inside `.cursor/commands/` — so the
first time you adopt guardrails on a project, that file does not exist yet.
This document gives you two ways to get started.

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
4. Compare both projects and show a gap analysis table by layer (1–5).
5. Ask me which layers to apply before changing anything.
6. Never overwrite src/, package.json, or tsconfig.json — merge only.
7. After Layers 1–5: run a code compliance audit (Layer 6) and report
   Blocker / Should-fix / Nit findings. Fix blockers before finishing.
8. Show the Layer 7 governance checklist.
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
3. Compare the project against the template and show a gap analysis
4. Apply approved layers — infrastructure only, never touching your `src/`
5. Run a code compliance audit (Layer 6) against your own code
6. Present a governance activation checklist (Layer 7)

---

## Suggested first-time layer order

For most existing projects, start with the safe layers:

```
1 2 3
```

Then, once those are green on CI:

```
4 5 6 7
```

If you are confident the project has no conflicting ESLint or TypeScript setup,
use `all` to apply everything in one pass.

---

## See also

- Full upgrade command: `.cursor/commands/guardrail-upgrade.md`
- Lessons from a real adoption: `docs/guardrail-upgrade-observations.md`
- User-level rule (universal habits): `docs/user-level-rule.md`
