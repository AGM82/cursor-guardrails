# /review

Run a pre-commit review pass on the current changes. Do not fix anything yet — report first.

1. Run `npm run typecheck`, `npm run lint`, and `npm run test`. Report any failures with the exact file and line.
2. Run `git diff` on staged and unstaged changes and review line-by-line for:
   - Logic errors, unhandled edge cases, and missing error handling.
   - Security issues per `10-security-popia.mdc` (input validation, secrets, authorization, XSS, SQL).
   - Any personal information being logged or hard-coded.
   - Accessibility regressions on UI changes.
3. Summarise findings grouped by severity: blocker, should-fix, nit. Wait for instruction before changing anything.
