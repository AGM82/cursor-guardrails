# /pr

Open a pull request for the current changes.

1. Review staged and unstaged changes with `git diff`.
2. Ensure `npm run typecheck`, `npm run lint`, and `npm run test` pass. If not, stop and report.
3. Write a Conventional Commits message describing what changed and why.
4. Commit and push to the current branch.
5. Open a PR with `gh pr create` using a clear title and a description covering: what changed, why, how it was tested, and any follow-ups.
6. Return the PR URL.
