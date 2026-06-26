#!/usr/bin/env bash
set -euo pipefail

DATE=$(date -u +%Y-%m-%d)
REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"

FINDINGS="[]"

if [ "${ESLINT_OUTDATED:-false}" = "true" ]; then
  FIND=$(jq -n \
    --arg id "eslint" \
    --arg label "ESLint" \
    --arg current "${ESLINT_CURRENT}" \
    --arg latest "${ESLINT_LATEST}" \
    --arg severity "${ESLINT_SEVERITY}" \
    --arg action "Run /update-deps in Cursor and accept the ESLint bump. If severity=major, check plugin compatibility first — see Knowledge Base in playbook.html." \
    --arg cursorCommand "/update-deps" \
    --arg moreInfoUrl "https://github.com/eslint/eslint/releases/tag/v${ESLINT_LATEST}" \
    '{id:$id,label:$label,current:$current,latest:$latest,severity:$severity,action:$action,cursorCommand:$cursorCommand,moreInfoUrl:$moreInfoUrl}')
  FINDINGS=$(echo "$FINDINGS" | jq --argjson f "$FIND" '. + [$f]')
fi

if [ "${TSESLINT_OUTDATED:-false}" = "true" ]; then
  FIND=$(jq -n \
    --arg id "typescript-eslint" \
    --arg label "typescript-eslint" \
    --arg current "${TSESLINT_CURRENT}" \
    --arg latest "${TSESLINT_LATEST}" \
    --arg severity "${TSESLINT_SEVERITY}" \
    --arg action "Run /update-deps in Cursor and accept the typescript-eslint bump. If severity=major, verify ESLint peer compatibility." \
    --arg cursorCommand "/update-deps" \
    --arg moreInfoUrl "https://github.com/typescript-eslint/typescript-eslint/releases/tag/v${TSESLINT_LATEST}" \
    '{id:$id,label:$label,current:$current,latest:$latest,severity:$severity,action:$action,cursorCommand:$cursorCommand,moreInfoUrl:$moreInfoUrl}')
  FINDINGS=$(echo "$FINDINGS" | jq --argjson f "$FIND" '. + [$f]')
fi

if [ "${NODE_OUTDATED:-false}" = "true" ]; then
  FIND=$(jq -n \
    --arg id "nodejs" \
    --arg label "Node.js LTS" \
    --arg current "${NODE_CURRENT}" \
    --arg latest "${NODE_LATEST}" \
    --arg severity "${NODE_SEVERITY}" \
    --arg action "Update .nvmrc and the node-version field in .github/workflows/ci.yml to ${NODE_LATEST}, then re-run CI." \
    --arg cursorCommand "Update .nvmrc to ${NODE_LATEST} and update node-version in .github/workflows/ci.yml to match" \
    --arg moreInfoUrl "https://nodejs.org/en/blog/release/" \
    '{id:$id,label:$label,current:$current,latest:$latest,severity:$severity,action:$action,cursorCommand:$cursorCommand,moreInfoUrl:$moreInfoUrl}')
  FINDINGS=$(echo "$FINDINGS" | jq --argjson f "$FIND" '. + [$f]')
fi

if [ "${GITLEAKS_OUTDATED:-false}" = "true" ]; then
  FIND=$(jq -n \
    --arg id "gitleaks" \
    --arg label "gitleaks" \
    --arg current "${GITLEAKS_CURRENT}" \
    --arg latest "${GITLEAKS_LATEST}" \
    --arg severity "${GITLEAKS_SEVERITY}" \
    --arg action "Update the gitleaks Docker image tag in .github/workflows/ci.yml from ${GITLEAKS_CURRENT} to ${GITLEAKS_LATEST}." \
    --arg cursorCommand "Update gitleaks image tag in .github/workflows/ci.yml from ${GITLEAKS_CURRENT} to ${GITLEAKS_LATEST}" \
    --arg moreInfoUrl "https://github.com/gitleaks/gitleaks/releases/tag/${GITLEAKS_LATEST}" \
    '{id:$id,label:$label,current:$current,latest:$latest,severity:$severity,action:$action,cursorCommand:$cursorCommand,moreInfoUrl:$moreInfoUrl}')
  FINDINGS=$(echo "$FINDINGS" | jq --argjson f "$FIND" '. + [$f]')
fi

FINDING_COUNT=$(echo "$FINDINGS" | jq 'length')
echo "findings_count=$FINDING_COUNT" >> "${GITHUB_ENV:?GITHUB_ENV is required}"

DATA_JSON=$(jq -n \
  --arg runDate "$DATE" \
  --argjson findings "$FINDINGS" \
  '{runDate:$runDate,findings:$findings}')

TABLE="| Item | Current | Latest | Severity |
|------|---------|--------|----------|
"
if [ "${ESLINT_OUTDATED:-false}" = "true" ]; then
  TABLE="${TABLE}| ESLint | \`${ESLINT_CURRENT}\` | \`${ESLINT_LATEST}\` | ${ESLINT_SEVERITY} |
"
fi
if [ "${TSESLINT_OUTDATED:-false}" = "true" ]; then
  TABLE="${TABLE}| typescript-eslint | \`${TSESLINT_CURRENT}\` | \`${TSESLINT_LATEST}\` | ${TSESLINT_SEVERITY} |
"
fi
if [ "${NODE_OUTDATED:-false}" = "true" ]; then
  TABLE="${TABLE}| Node.js LTS | \`${NODE_CURRENT}\` | \`${NODE_LATEST}\` | ${NODE_SEVERITY} |
"
fi
if [ "${GITLEAKS_OUTDATED:-false}" = "true" ]; then
  TABLE="${TABLE}| gitleaks | \`${GITLEAKS_CURRENT}\` | \`${GITLEAKS_LATEST}\` | ${GITLEAKS_SEVERITY} |
"
fi

ISSUE_BODY=$(cat <<EOF
## Guardrail review — $DATE

<!-- guardrail-review-data
$DATA_JSON
-->

$TABLE
**Cursor changelog** (manual review): https://cursor.com/changelog

To adopt: open [playbook.html](https://github.com/$REPO/blob/main/playbook.html) → Updates section, or run \`/guardrail-upgrade\` in Cursor.

_Opened automatically by the weekly-guardrail-review workflow._
EOF
)

if [ "${DRY_RUN:-false}" = "true" ]; then
  echo "=== DRY RUN: $FINDING_COUNT finding(s) ==="
  echo "$ISSUE_BODY"
  exit 0
fi

TITLE_PREFIX="[guardrail-review]"

EXISTING=$(gh issue list \
  --repo "$REPO" \
  --label "guardrail-review" \
  --state open \
  --limit 1 \
  --json number,title \
  --jq '.[0].number // empty')

if [ "$FINDING_COUNT" = "0" ]; then
  echo "No findings this week."
  if [ -n "$EXISTING" ]; then
    gh issue comment "$EXISTING" --repo "$REPO" --body "Weekly review on $DATE found no new findings. Closing as all clear."
    gh issue close "$EXISTING" --repo "$REPO"
    echo "Closed existing issue #$EXISTING — all clear."
  fi
elif [ -n "$EXISTING" ]; then
  COMMENT_BODY=$(cat <<EOF
Updated findings from $DATE run:

<!-- guardrail-review-data
$DATA_JSON
-->

$TABLE
_Updated by weekly-guardrail-review workflow._
EOF
)
  gh issue comment "$EXISTING" --repo "$REPO" --body "$COMMENT_BODY"
  echo "Appended to existing issue #$EXISTING."
else
  gh issue create \
    --repo "$REPO" \
    --title "$TITLE_PREFIX Weekly update — $DATE" \
    --body "$ISSUE_BODY" \
    --label "guardrail-review"
  echo "Created new issue."
fi
