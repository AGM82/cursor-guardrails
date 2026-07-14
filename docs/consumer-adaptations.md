# Consumer adaptations

Patterns product repos often need after starting from [cursor-guardrails-starter](https://github.com/AGM82/cursor-guardrails-starter) (or adopting via `/guardrail-upgrade`). **Optional** — adopt when the profile matches; do not treat these as default starter dependencies.

Hub only — not synced into the starter. Worked example: [worked-example-africa-risk-map.md](./worked-example-africa-risk-map.md).

---

## Next.js App Router

The starter demo is **Vite**. Full-stack products commonly swap to Next.js 16 App Router. Record the override in `.cursor/rules/90-project-context.mdc` and `.cursor/rules/30-react-stack.mdc`.

| Topic                     | Pattern                                                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tailwind                  | Use `@tailwindcss/postcss` instead of `@tailwindcss/vite`; CSS entry often `src/app/globals.css`                                                                                      |
| Build provenance / attest | Attesting every file under `.next/**` can exceed GitHub’s subject cap (~1024). Prefer attesting a single artifact (e.g. `next-standalone.tar.gz`)                                     |
| Build-time secrets        | Clerk / Prisma / DB URLs may be required at `next build`. Use documented **placeholder** env values in CI (never real secrets) and allowlist those placeholders in gitleaks if needed |
| Vitest environment        | `happy-dom` is a common Next-friendly alternative to `jsdom`; record the choice in project context                                                                                    |
| Vite remaining            | Vitest may still use Vite as its transformer even when the app bundler is Next — that is not leftover SPA scaffolding                                                                 |

## gitleaks placeholders

CI gitleaks will flag strings that look like keys (`sk_test_…`, `pk_…`) even when they are intentional build placeholders.

Pattern: add a project-local `.gitleaks.toml` allowlist for documented placeholder tokens only (comment why each exists). Prefer obvious fake values (for example `REPLACE_ME_BUILD_PLACEHOLDER`) over high-entropy strings that look like real keys.

## High-risk B2B / PI appendix (patterns, not scaffold)

For High-risk initiatives (personal information, premiums, multi-tenant B2B):

| Pattern                                    | Why                                                                                                             |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Fixture-first domain modules + domain docs | Keeps agents and humans aligned on invariants without inventing data                                            |
| Postgres RLS keyed on tenant claims        | Enforces tenant isolation at the data layer, not only in app code                                               |
| POPIA anonymisation / retention path       | Matches `10-security-popia.mdc`; document in `90-project-context.mdc` data classification                       |
| Public repo + no-real-data rationale       | Branch protection + empty real-data policy can coexist with a public GitHub repo if fixtures only are committed |
| MapLibre over Mapbox (if maps)             | Licensing / ToS — document the choice; do not silently add Mapbox                                               |

None of these belong in the default starter. Add them when Schedule A / Throughline / project risk is High (or Medium with PI).

## Intentional deviations checklist

When agents run `/audit` or `/guardrail-upgrade`, point them at a short README note listing intentional deviations (example):

```markdown
## Guardrails consumer — intentional deviations

- App bundler: Next.js App Router (not Vite) — see 90-project-context
- Vitest env: happy-dom
- CI attest: next-standalone.tar.gz (not .next/\*\*)
- .gitleaks.toml: allowlisted build placeholders only
```

That stops “helpful” rewrites back to Vite defaults.
