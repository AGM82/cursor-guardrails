# Worked example — Africa Risk Map

Sanitised review of a real product started from GitHub **Use this template** on the fat hub (pre–v1.5.0). Client-specific internals omitted; patterns are universal.

Full original review was produced with the consumer audit prompt (Keep / Adapt / Remove / Update). This file is the feedback loop that drove **guardrail v1.5.0** (hub/starter split + path-agnostic traveling files).

---

## Context

- **Started:** Use this template from cursor-guardrails; early Dependabot PRs; then `chore: strip template leftovers` (~**−5,479 lines**); then foundations migration to Next.js.
- **Product:** multi-tenant B2B PA risk platform — territory risk map, org/location/headcount, policy structure, premium calculator, external signals.
- **Stack (after productisation):** Next.js App Router / React 19, Prisma + PostGIS, Clerk, MapLibre, Inngest, Sentry, Vitest (`happy-dom`) + Playwright, Cloud Run–oriented deploy.
- **Guardrail version at review:** project `1.4.0` = hub `1.4.0`. No `guardrail-prescription.json`.

---

## Value delivered (Keep — with evidence)

| Artefact                                                       | Why it helped                        | Evidence                                                                                                 |
| -------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Branch protection + named CI gates                             | Forced PR-only merge                 | `main` requires the three template check names; many merged `feat/`/`fix/` PRs                           |
| `ci.yml` (verify + gitleaks + Semgrep + audit + SBOM + attest) | Deterministic quality/security floor | gitleaks flagged build placeholders → `.gitleaks.toml`; attest failed on `.next/**` → tarball adaptation |
| Coverage thresholds                                            | Stopped under-tested domain landings | Restored gates with domain tests after CI failure                                                        |
| Conventional Commits + husky/commitlint                        | Uniform history                      | Recent history dominated by conventional types                                                           |
| Filled `90-project-context.mdc`                                | Highest-signal agent orientation     | Glossary, canonical paths, POPIA, documented Vite→Next deviations                                        |
| `10-security-popia.mdc` + product `SECURITY.md`                | Matched High-risk PI/finance         | Private vuln reporting; POPIA path — not placeholders                                                    |
| ESLint/Prettier + strict TS                                    | Shared bar while adapting for Next   | Strict flags retained; Next `tsconfig` plugins                                                           |
| axe helper                                                     | A11y habit beyond the demo           | Used across map/admin/calculator UI tests                                                                |
| Slash commands + hooks scaffolding                             | Agent workflow language              | Present; runtime catch of mistakes not strongly evidenced in git                                         |
| Dependabot                                                     | Early dependency hygiene             | Early PRs before product code                                                                            |
| Bugbot                                                         | Post-merge gap catch                 | Dedicated backlog PR + fix commits                                                                       |

---

## Inherited but wrong (Remove or Adapt)

| Artefact                                                                           | Action           | Why                                                         |
| ---------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------- |
| `playbook.html`, Throughline/Cloudflare docs, weekly/bi-weekly AI-review workflows | **Already gone** | Hub meta, not product — mass-deleted in strip PR            |
| Demo `Greeting` / Vite `App` / SPA landing                                         | **Already gone** | Replaced by Next App Router                                 |
| `audit.md` still naming `Greeting` / requiring `docs/links.md`                     | **Adapt**        | Stale for product (fixed upstream in v1.5.0)                |
| `31-design.mdc` citing `Greeting.test` / `src/index.css`                           | **Adapt**        | App uses `globals.css` (fixed upstream in v1.5.0)           |
| `AGENTS.md` “frontend-only demo scaffold”                                          | **Adapt**        | False after productisation (fixed upstream in v1.5.0)       |
| `30-react-stack` advertising only `@tailwindcss/vite`                              | **Adapt**        | Next uses `@tailwindcss/postcss` (fixed upstream in v1.5.0) |

---

## What the template should change (feedback — addressed in 1.5.0)

1. **Split scaffolds** — thin starter without playbook/Throughline/AI-review → `cursor-guardrails-starter` + `templateMeta` + sync workflow.
2. **Stop hardcoding demo paths** in traveling `audit.md` / `31-design.mdc` → read `90-project-context.mdc`.
3. **Document Next / High-risk adaptations** → `docs/consumer-adaptations.md` (not default scaffold).
4. **AGENTS.md** must not describe every child as a demo scaffold.
5. **Separate template-meta CI** from product CI — hub workflows stay on hub; never re-copied by `/guardrail-upgrade`.
6. **Post-generate cleanup** for existing fat children → `docs/post-generate-cleanup.md`.

---

## One-paragraph verdict

Starting from cursor-guardrails was **net-positive**: CI, branch protection, commit discipline, security scanning, strict TypeScript/ESLint, axe testing, and a filled project context steered a High-risk build — evidenced by gitleaks/attest/coverage failures that forced real fixes. The largest cost was **hub scaffolding that is not guardrail value**, which had to be mass-deleted before the product could breathe. v1.5.0 turns that learning into a structural split so the next project does not pay the same tax.

## See also

- [post-generate-cleanup.md](./post-generate-cleanup.md)
- [consumer-adaptations.md](./consumer-adaptations.md)
- [guardrail-upgrade-observations.md](./guardrail-upgrade-observations.md)
