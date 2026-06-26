#!/usr/bin/env node
/* global fetch, setTimeout */
/**
 * ai-review.mjs
 *
 * Calls the Anthropic API with a compact summary of key repo files and asks
 * six focused questions across the holistic development domains. Validates
 * npm/GitHub suggestions deterministically before surfacing them. Outputs a
 * structured JSON payload to stdout for the workflow to consume.
 *
 * Environment variables required:
 *   ANTHROPIC_API_KEY  — Anthropic API key
 *   REVIEW_TYPE        — "biweekly" | "cursor" | "security" (default: biweekly)
 *   DRY_RUN            — "true" to skip API call and output mock data
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const API_KEY = process.env.ANTHROPIC_API_KEY;
const REVIEW_TYPE = process.env.REVIEW_TYPE || 'biweekly';
const DRY_RUN = process.env.DRY_RUN === 'true';
const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 2048;

// ── Read key repo files (compact summaries, not full contents) ──────────────

function safeRead(path, maxLines = 60) {
  if (!existsSync(path)) return `[file not found: ${path}]`;
  const lines = readFileSync(path, 'utf8').split('\n');
  return lines.slice(0, maxLines).join('\n');
}

function buildContext() {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const guardVersion = safeRead('.cursor/guardrail-version', 1).trim();
  const nvmrc = safeRead('.nvmrc', 1).trim();

  const deps = Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })
    .map(([k, v]) => `${k}@${v}`)
    .join(', ');

  const ruleFiles = [
    '.cursor/rules/00-core.mdc',
    '.cursor/rules/10-security-popia.mdc',
    '.cursor/rules/20-commits.mdc',
    '.cursor/rules/30-react-stack.mdc',
    '.cursor/rules/31-design.mdc',
    '.cursor/rules/32-ux-behavioural.mdc',
    '.cursor/rules/33-data-science.mdc',
    '.cursor/rules/40-tooling-supply-chain.mdc',
    '.cursor/rules/50-ai-tooling.mdc',
  ]
    .filter(existsSync)
    .map(f => {
      const name = f.split('/').pop();
      const lines = readFileSync(f, 'utf8').split('\n');
      // First 20 lines captures the intent without sending full file.
      return `--- ${name} ---\n${lines.slice(0, 20).join('\n')}`;
    })
    .join('\n\n');

  const hooksJson = safeRead('.cursor/hooks.json', 30);
  const agentsMd = safeRead('AGENTS.md', 40);
  const ciYml = safeRead('.github/workflows/ci.yml', 60);
  const commands = [
    '.cursor/commands/review.md',
    '.cursor/commands/update-deps.md',
    '.cursor/commands/guardrail-upgrade.md',
    '.cursor/commands/pr.md',
  ]
    .filter(existsSync)
    .map(f => `[${f.split('/').pop()}] ${safeRead(f, 10)}`)
    .join('\n');

  return `CURSOR-GUARDRAILS TEMPLATE — CURRENT STATE
Node.js: ${nvmrc} | Guardrail version: ${guardVersion}
Dependencies: ${deps}

AGENTS.MD (first 40 lines):
${agentsMd}

RULE FILES (first 20 lines each):
${ruleFiles}

HOOKS (.cursor/hooks.json):
${hooksJson}

CI PIPELINE (.github/workflows/ci.yml):
${ciYml}

SLASH COMMANDS:
${commands}`;
}

// ── Topic definitions per review type ──────────────────────────────────────

const TOPICS = {
  biweekly: [
    {
      id: 'ai-tooling',
      label: 'AI Tooling',
      question: `You are reviewing the AI tooling strategy for this developer guardrails template.
Identify improvements in these areas:
1. New Cursor IDE capabilities (rules, hooks, agent patterns, MCP) not yet reflected in the config
2. Other AI coding tools that should be added to the stack (not replace Cursor unless 10x better in 2+ dimensions)
3. New AI agent patterns or prompt engineering techniques the slash commands could adopt
4. Gaps in the hooks or rules that leave AI agent behaviour unguarded

For each suggestion: is it an Addition (fills a gap) or Replacement (replaces something)?
Apply a high bar for replacements.`,
    },
    {
      id: 'engineering',
      label: 'Engineering',
      question: `Review the engineering quality guardrails in this template.
Identify improvements in:
1. ESLint rules or plugins that should be added (security, complexity, accessibility)
2. TypeScript strict options not yet enabled
3. New CI/CD security practices (supply chain, provenance, SLSA)
4. Testing patterns missing for AI-generated code
5. Performance monitoring or budget enforcement missing from CI`,
    },
    {
      id: 'design',
      label: 'Design',
      question: `Review the design guardrails in this template (31-design.mdc if present).
Identify improvements in:
1. Design system principles or tokens not yet enforced
2. Accessibility rules missing (WCAG, aria, contrast)
3. CSS architecture patterns the community has adopted (container queries, cascade layers)
4. Design-to-code tooling that would benefit a single developer
5. Motion and animation best practices missing`,
    },
    {
      id: 'ux-behavioural',
      label: 'UX & Behavioural Science',
      question: `Review the UX and behavioural science guardrails in this template (32-ux-behavioural.mdc if present).
Identify improvements in:
1. Usability heuristics not yet encoded in the rules
2. Accessibility compliance gaps (WCAG 2.2, ARIA patterns)
3. Dark patterns to explicitly prohibit that are not yet listed
4. New UX research findings (2024–2026) that should inform the rules
5. Cognitive load and progressive disclosure patterns missing`,
    },
    {
      id: 'data-science',
      label: 'Data Science & Measurement',
      question: `Review the data science and measurement guardrails in this template (33-data-science.mdc if present).
Identify improvements in:
1. Core Web Vitals or performance measurement missing
2. Analytics and event tracking best practices not covered
3. Privacy-first data collection patterns (POPIA, GDPR alignment)
4. Data visualisation rules missing
5. Statistical validity and A/B testing guidance gaps`,
    },
    {
      id: 'security',
      label: 'Security',
      question: `Review the security posture of this AI-assisted developer template.
Identify improvements in:
1. OWASP LLM Top 10 risks not yet mitigated in the hooks or rules
2. Supply chain security gaps (pinning, provenance, attestation)
3. Secret management patterns missing
4. New security scanning tools that complement gitleaks and Semgrep
5. AI-specific attack vectors (prompt injection, data exfiltration via agent) not yet guarded`,
    },
  ],
  cursor: [
    {
      id: 'cursor-capabilities',
      label: 'Cursor New Capabilities',
      question: `A new version of Cursor IDE has been released. Review this template's Cursor configuration.
Identify:
1. New Cursor rule capabilities or syntax not yet used
2. New hook events available that should be added to hooks.json
3. New Cursor agent patterns or slash command capabilities
4. New MCP integrations that would benefit this template
5. Any existing config that is now deprecated or superseded

Be specific about which files need changing and what the change should be.`,
    },
  ],
  security: [
    {
      id: 'owasp-llm',
      label: 'OWASP LLM Top 10',
      question: `Conduct a security review against the OWASP LLM Top 10 (2025 edition).
For each of the top 10 risks, assess whether this template adequately mitigates it:
1. LLM01 Prompt Injection
2. LLM02 Sensitive Information Disclosure
3. LLM03 Supply Chain
4. LLM04 Data and Model Poisoning
5. LLM05 Improper Output Handling
6. LLM06 Excessive Agency
7. LLM07 System Prompt Leakage
8. LLM08 Vector and Embedding Weaknesses
9. LLM09 Misinformation
10. LLM10 Unbounded Consumption

For each gap found, suggest a specific rule, hook, or CI change.`,
    },
    {
      id: 'supply-chain',
      label: 'Supply Chain Security',
      question: `Review the supply chain security posture of this template.
Identify gaps in:
1. Dependency pinning (exact versions vs ranges)
2. Software bill of materials (SBOM) generation
3. SLSA provenance for build artefacts
4. Action version pinning in CI (SHA vs tag)
5. npm package integrity (lockfile, audit, provenance)
6. Container image provenance (gitleaks, Semgrep)`,
    },
  ],
};

// ── Anthropic API call ───────────────────────────────────────────────────────

async function callAnthropic(systemPrompt, userMessage) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          // Mark the system prompt (repo context) as cacheable — reduces cost ~90% on repeat runs.
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }
  return response.json();
}

// ── npm validation — strip hallucinated packages ─────────────────────────────

function validateNpmPackage(packageName) {
  try {
    const result = execSync(
      `npm info "${packageName}" --json 2>/dev/null`,
      { encoding: 'utf8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const info = JSON.parse(result);
    // Accept if the package exists and has been published (dist-tags.latest is set).
    return !!info?.['dist-tags']?.latest;
  } catch {
    return false;
  }
}

// ── Parse structured suggestions from Claude's response ─────────────────────

function parseSuggestions(text, topicId) {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) ||
                    text.match(/\{[\s\S]*"suggestions"[\s\S]*\}/);
  if (!jsonMatch) return [];

  try {
    const raw = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(raw.trim());
    const suggestions = parsed.suggestions || parsed;
    if (!Array.isArray(suggestions)) return [];

    return suggestions
      .filter(s => s.title && s.proposed && s.confidence)
      .map(s => ({
        id: `${topicId}-${s.id || Math.random().toString(36).slice(2, 7)}`,
        topic: topicId,
        title: String(s.title).slice(0, 120),
        area: s.area || topicId,
        current: s.current || 'Not implemented',
        proposed: String(s.proposed).slice(0, 500),
        confidence: ['high', 'medium', 'low'].includes(s.confidence) ? s.confidence : 'low',
        stability: ['stable', 'emerging', 'experimental'].includes(s.stability) ? s.stability : 'stable',
        effort: ['low', 'medium', 'high'].includes(s.effort) ? s.effort : 'medium',
        source: s.source || '',
        reason: String(s.reason || '').slice(0, 300),
        npmPackage: s.npmPackage || null,
        validated: true,
      }))
      .filter(s => {
        // Validate npm packages before including
        if (s.npmPackage) {
          const valid = validateNpmPackage(s.npmPackage);
          if (!valid) {
            process.stderr.write(`[ai-review] Dropped suggestion "${s.title}" — npm package "${s.npmPackage}" not found\n`);
            return false;
          }
        }
        return true;
      });
  } catch (e) {
    process.stderr.write(`[ai-review] Failed to parse suggestions for ${topicId}: ${e.message}\n`);
    return [];
  }
}

// ── Watchlist: load previous suggestions to detect recurring signals ─────────

function loadWatchlist() {
  if (!existsSync('.github/ai-review-watchlist.json')) return [];
  try {
    return JSON.parse(readFileSync('.github/ai-review-watchlist.json', 'utf8'));
  } catch {
    return [];
  }
}

function updateWatchlist(watchlist, newSuggestions) {
  const now = new Date().toISOString().slice(0, 10);
  const updated = [...watchlist];

  for (const s of newSuggestions) {
    const existing = updated.find(w => w.title === s.title && w.topic === s.topic);
    if (existing) {
      existing.seenCount = (existing.seenCount || 1) + 1;
      existing.lastSeen = now;
      // Upgrade confidence after appearing twice
      if (existing.seenCount >= 2 && existing.confidence === 'low') {
        existing.confidence = 'medium';
      }
      if (existing.seenCount >= 3 && existing.confidence === 'medium') {
        existing.confidence = 'high';
      }
    } else {
      updated.push({ ...s, firstSeen: now, lastSeen: now, seenCount: 1 });
    }
  }

  // Keep watchlist clean: drop entries not seen in 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return updated.filter(w => new Date(w.lastSeen) > sixMonthsAgo);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!API_KEY && !DRY_RUN) {
    process.stderr.write('[ai-review] ANTHROPIC_API_KEY is not set\n');
    process.exit(1);
  }

  const topics = TOPICS[REVIEW_TYPE] || TOPICS.biweekly;
  const context = buildContext();
  const watchlist = loadWatchlist();

  const SYSTEM_PROMPT = `You are an expert AI software development consultant reviewing the cursor-guardrails template.
This is a reusable project template for a single developer who wants to work at the level of an expert team.
The goal spans six domains: Product Thinking, Design, UX/Behavioural Science, Engineering, Data Science, AI Tooling.

Your job is to identify specific, actionable, verifiable improvements.

RULES FOR YOUR RESPONSE:
1. Output ONLY valid JSON in this exact format:
   {"suggestions": [{"id":"string","title":"string","area":"string","current":"string","proposed":"string","confidence":"high|medium|low","stability":"stable|emerging|experimental","effort":"low|medium|high","source":"string","reason":"string","npmPackage":"string or null"}]}
2. Every suggestion must have a real source (named standard, official docs URL pattern, or npm package name).
3. Do not suggest anything without a credible, verifiable basis.
4. For npm package suggestions, include the exact package name in "npmPackage".
5. "experimental" stability suggestions must have confidence "low" or "medium" only.
6. Maximum 5 suggestions per topic call.
7. Be specific about what file to change and what the change is.

Current repo context (cached):
${context}`;

  const allSuggestions = [];
  const runDate = new Date().toISOString().slice(0, 10);

  if (DRY_RUN) {
    process.stderr.write('[ai-review] DRY RUN — skipping API calls\n');
    const mockOutput = {
      runDate,
      reviewType: REVIEW_TYPE,
      suggestions: [
        {
          id: 'dry-run-1',
          topic: 'engineering',
          title: 'Dry run suggestion',
          area: 'Engineering',
          current: 'Not implemented',
          proposed: 'This is a dry run — no real API call was made',
          confidence: 'high',
          stability: 'stable',
          effort: 'low',
          source: 'dry-run',
          reason: 'Testing the workflow',
          npmPackage: null,
          validated: true,
        },
      ],
      watchlist: [],
    };
    process.stdout.write(JSON.stringify(mockOutput));
    return;
  }

  for (const topic of topics) {
    process.stderr.write(`[ai-review] Calling API for topic: ${topic.label}\n`);
    try {
      const response = await callAnthropic(SYSTEM_PROMPT, topic.question);
      const text = response.content?.[0]?.text || '';
      const suggestions = parseSuggestions(text, topic.id);
      process.stderr.write(`[ai-review] ${topic.label}: ${suggestions.length} valid suggestion(s)\n`);
      allSuggestions.push(...suggestions);
    } catch (e) {
      process.stderr.write(`[ai-review] Error on topic ${topic.label}: ${e.message}\n`);
    }

    // Small delay between calls to avoid rate limits.
    await new Promise(r => setTimeout(r, 1500));
  }

  const updatedWatchlist = updateWatchlist(watchlist, allSuggestions);

  // Actionable: high or medium confidence, stable or emerging.
  const actionable = allSuggestions.filter(
    s => s.confidence !== 'low' || s.stability === 'stable'
  );
  // Watchlist: low confidence or experimental.
  const watchlistItems = allSuggestions.filter(
    s => s.confidence === 'low' && s.stability === 'experimental'
  );

  const output = {
    runDate,
    reviewType: REVIEW_TYPE,
    suggestions: actionable,
    watchlist: watchlistItems,
    updatedWatchlist,
  };

  process.stdout.write(JSON.stringify(output));
}

main().catch(e => {
  process.stderr.write(`[ai-review] Fatal: ${e.message}\n`);
  process.exit(1);
});
