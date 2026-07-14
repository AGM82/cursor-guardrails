#!/usr/bin/env node
/**
 * Builds a thin consumer-starter tree from this hub repo.
 *
 * Copies adoption Layers 1–5, the Vite demo app, consumer docs, and CI helpers.
 * Excludes everything listed in guardrail-layers.json → templateMeta.files
 * (playbook, Throughline, scheduled AI reviews, etc.).
 *
 * Usage:
 *   node .github/scripts/sync-starter-template.mjs              # write to .starter-out/
 *   node .github/scripts/sync-starter-template.mjs --dry-run    # assert only, no write
 *   node .github/scripts/sync-starter-template.mjs --out DIR
 *
 * Exit 1 if a templateMeta path would be included, or a Layer file is missing.
 */
import {
  readFileSync,
  existsSync,
  mkdirSync,
  cpSync,
  rmSync,
  writeFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST_PATH = join(ROOT, 'guardrail-layers.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const outIdx = args.indexOf('--out');
const OUT = outIdx >= 0 ? args[outIdx + 1] : join(ROOT, '.starter-out');

function fail(msg) {
  process.stderr.write(`[sync-starter-template] ${msg}\n`);
  process.exitCode = 1;
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const metaFiles = new Set(manifest.templateMeta?.files || []);
const consumerDocs = manifest.templateMeta?.starterIncludesConsumerDocs || [];

const layerFiles = [];
for (const layer of Object.values(manifest.adoptionLayers || {})) {
  for (const f of layer.files || []) layerFiles.push(f);
}

/** Extra consumer files not listed in adoption layers but required for a working starter. */
const EXTRA = [
  'guardrail-layers.json',
  '.cursor/guardrail-version',
  'package.json',
  'package-lock.json',
  'vite.config.ts',
  'components.json',
  'index.html',
  '.github/scripts/check-manifest-drift.mjs',
  ...consumerDocs,
];

const DEMO_DIRS = ['src'];

function walkFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkFiles(p, acc);
    else acc.push(relative(ROOT, p).replace(/\\/g, '/'));
  }
  return acc;
}

const demoFiles = DEMO_DIRS.flatMap((d) => walkFiles(join(ROOT, d)));

const allCandidates = [...new Set([...layerFiles, ...EXTRA, ...demoFiles])];

const leaked = allCandidates.filter((f) => metaFiles.has(f));
if (leaked.length) {
  fail(`templateMeta paths would be synced (bug): ${leaked.join(', ')}`);
  process.exit(1);
}

const missing = layerFiles.filter((f) => !existsSync(join(ROOT, f)));
if (missing.length) {
  fail(`Layer files missing on disk: ${missing.join(', ')}`);
  process.exit(1);
}

process.stdout.write(
  `[sync-starter-template] ${allCandidates.length} files selected; ${metaFiles.size} hub-only paths excluded.\n`
);

if (dryRun) {
  process.stdout.write('[sync-starter-template] dry-run OK — no files written.\n');
  process.exit(process.exitCode || 0);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

for (const rel of allCandidates) {
  const src = join(ROOT, rel);
  if (!existsSync(src)) {
    process.stderr.write(`[sync-starter-template] skip missing extra: ${rel}\n`);
    continue;
  }
  const dest = join(OUT, rel);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
}

const agentsSrc = join(OUT, 'AGENTS.md');
if (existsSync(agentsSrc)) {
  let agents = readFileSync(agentsSrc, 'utf8');
  agents = agents.replace(/^- Playbook dashboard:.*\n?/m, '');
  agents = agents.replace(
    /The Backend\/Database\/Deployment rules are glob-scoped and inert until a project\r?\nactually adds a server, database, or deploy pipeline — they cost nothing to keep\r?\ninstalled even in the current frontend-only demo scaffold\./,
    `The Backend/Database/Deployment rules are glob-scoped and activate automatically
when this project adds a server, database, or deploy pipeline — they cost nothing
to keep installed until then.`
  );
  writeFileSync(agentsSrc, agents);
}

const prTpl = join(OUT, '.github/pull_request_template.md');
if (existsSync(prTpl)) {
  let body = readFileSync(prTpl, 'utf8');
  body = body.replace(/\n?- \[ \] Does this change affect `playbook\.html`\?.*\n?/g, '\n');
  writeFileSync(prTpl, body);
}

const version = manifest.guardrailVersion || '0.0.0';
const starterReadme = `# Cursor Guardrails Starter

Thin project template — **guardrails only**, no playbook, Throughline prompts, or scheduled AI-review workflows.

Synced automatically from the [cursor-guardrails](https://github.com/AGM82/cursor-guardrails) hub (guardrail **v${version}**). Use this repo for GitHub **Use this template**. Keep a separate plain \`git clone\` of the **hub** as your reference clone for \`/guardrail-upgrade\`.

## Setup (new project)

1. GitHub → **Use this template** → create your repository.
2. \`npm install\` (activates husky). If you use \`nvm\`, run \`nvm use\` first.
3. \`npm run typecheck\`, \`npm run lint\`, \`npm run test\`.
4. Fill in \`.cursor/rules/90-project-context.mdc\` (canonical files, glossary, data classification).
5. Replace the demo app under \`src/\` with your product.
6. Commit; enable branch protection on \`main\` (three CI checks — see hub README).
7. For future guardrail updates: clone the **hub** separately and run \`/guardrail-upgrade\` in this project.

## What is intentionally missing

Hub-only assets stay in [cursor-guardrails](https://github.com/AGM82/cursor-guardrails): \`playbook.html\`, Throughline handoff docs, bi-weekly/weekly AI review, version propagation to Throughline, Cloudflare playbook hosting. Do not copy those here.

## Docs in this starter

- [docs/bootstrap-guardrail-upgrade.md](./docs/bootstrap-guardrail-upgrade.md) — adopt on an existing repo
- [docs/guardrail-layers.md](./docs/guardrail-layers.md) — layer model
- [docs/guardrail-upgrade-observations.md](./docs/guardrail-upgrade-observations.md) — lessons from real adoption

Consumer adaptations (Next.js, gitleaks placeholders, High-risk B2B patterns) live on the hub: [docs/consumer-adaptations.md](https://github.com/AGM82/cursor-guardrails/blob/main/docs/consumer-adaptations.md).

## Branch protection

Required checks (same names as hub CI):

- \`Typecheck, lint, test, build\`
- \`Secret scan (gitleaks)\`
- \`SAST (Semgrep OWASP Top Ten)\`
`;

writeFileSync(join(OUT, 'README.md'), starterReadme);

const pkgPath = join(OUT, 'package.json');
if (existsSync(pkgPath)) {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.name = 'cursor-guardrails-starter';
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

const written = walkFiles(OUT);
const writtenLeak = written.filter((f) => metaFiles.has(f));
if (writtenLeak.length) {
  fail(`Written tree contains templateMeta paths: ${writtenLeak.join(', ')}`);
  process.exit(1);
}

process.stdout.write(`[sync-starter-template] wrote ${written.length} files to ${OUT}\n`);
