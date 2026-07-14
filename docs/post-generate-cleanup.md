# Post-generate cleanup (fat hub → product)

Use this if your product repo was created with GitHub **Use this template** on **cursor-guardrails** (the hub) **before** the hub/starter split (guardrail v1.5.0), or if someone generated from the hub by mistake.

New projects should use [cursor-guardrails-starter](https://github.com/AGM82/cursor-guardrails-starter) instead — then this cleanup is unnecessary.

Evidence: Africa Risk Map deleted ~5.5k lines of hub meta in a single “strip template leftovers” PR — see [worked-example-africa-risk-map.md](./worked-example-africa-risk-map.md).

---

## Safe to delete (hub-only / templateMeta)

Confirm each path exists, then remove (do not leave stubs):

| Path                                                                   | Why                                                     |
| ---------------------------------------------------------------------- | ------------------------------------------------------- |
| `playbook.html`                                                        | Hub dashboard — not your product                        |
| `_headers`                                                             | Cloudflare Pages playbook cache headers                 |
| `docs/cloudflare-setup.md`                                             | Playbook hosting                                        |
| `docs/connect-guardrails.md`                                           | Hub ↔ Throughline narrative                             |
| `docs/guardrail-prescription.md`                                       | Throughline contract (keep only if you use Throughline) |
| `docs/links.md`                                                        | Hub link catalogue                                      |
| `docs/project-lifecycle.md`                                            | Hub/CTO lifecycle narrative (optional keep if useful)   |
| `docs/throughline-*.md`                                                | Throughline agent prompts                               |
| `docs/consumer-adaptations.md`                                         | Hub doc — read on GitHub; no need to vendor             |
| `docs/post-generate-cleanup.md`                                        | This file — delete after use                            |
| `docs/worked-example-africa-risk-map.md`                               | Hub worked example                                      |
| `docs/cursor-version.txt`, `docs/user-level-rule.md`                   | Hub maintainer helpers                                  |
| `.github/workflows/bi-weekly-ai-review.yml`                            | Hub scheduled Anthropic review                          |
| `.github/workflows/weekly-guardrail-review.yml`                        | Hub weekly tool review                                  |
| `.github/workflows/propagate-guardrail-version.yml`                    | Hub → Throughline dispatch                              |
| `.github/workflows/sync-starter-template.yml`                          | Hub → starter sync                                      |
| `.github/scripts/ai-review.mjs`                                        | Hub AI review                                           |
| `.github/scripts/weekly-guardrail-review-manage-issue.sh`              | Hub weekly review                                       |
| `.github/scripts/sync-starter-template.mjs`                            | Hub starter sync                                        |
| `.github/ai-review-decisions.json`, `.github/ai-review-watchlist.json` | Hub AI review state                                     |

Canonical list: `guardrail-layers.json` → `templateMeta.files` on the hub reference clone.

## Keep (guardrail value)

- `.cursor/rules/`, `.cursor/commands/`, `.cursor/hooks*`, `AGENTS.md`
- Husky, commitlint, ESLint, Prettier, `tsconfig`, `ci.yml` (adapt for your stack)
- `guardrail-layers.json` + `.github/scripts/check-manifest-drift.mjs` if CI still runs the drift check
- `.cursor/guardrail-version`

## After stripping

1. Rewrite `.cursor/rules/90-project-context.mdc` for **your** product (canonical files, glossary, POPIA).
2. Fix stale agent text if still present: `AGENTS.md` “demo scaffold”, `audit.md` / `31-design.mdc` demo paths (fixed upstream in v1.5.0 — run `/guardrail-upgrade` to refresh).
3. Drop playbook checkbox from `.github/pull_request_template.md` if present.
4. Commit as `chore: strip hub template leftovers`.

`/guardrail-upgrade` will **not** re-copy `templateMeta` files after v1.5.0.
