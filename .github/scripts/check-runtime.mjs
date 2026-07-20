#!/usr/bin/env node
/**
 * Fails when the active Node version does not satisfy package.json engines.node
 * / .nvmrc, or when the platform Rolldown native binding is missing after install.
 *
 * engines.node must stay a simple ">=x.y.z" floor — this script does not pull in
 * a semver dependency.
 *
 * Usage:
 *   node .github/scripts/check-runtime.mjs
 *   node .github/scripts/check-runtime.mjs --self-test
 *   node .github/scripts/check-runtime.mjs --node-version=22.11.0
 *   node .github/scripts/check-runtime.mjs --simulate-missing-binding
 *   node .github/scripts/check-runtime.mjs --skip-binding
 */
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);

const PREFIX = '[check:runtime]';

/** @param {string} message */
function fail(message) {
  process.stderr.write(`${PREFIX} ${message}\n`);
  process.exitCode = 1;
}

/**
 * @param {string} version e.g. "22.11.0" or "v22.11.0"
 * @returns {[number, number, number]}
 */
function parseVersion(version) {
  const cleaned = String(version).trim().replace(/^v/i, '');
  const parts = cleaned.split('.').map((p) => Number.parseInt(p, 10));
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`invalid Node version: ${version}`);
  }
  return /** @type {[number, number, number]} */ ([parts[0], parts[1], parts[2]]);
}

/**
 * Compare a.b.c triples. Returns negative if a < b, 0 if equal, positive if a > b.
 * @param {[number, number, number]} a
 * @param {[number, number, number]} b
 */
function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

/**
 * Only supports a simple ">=x.y.z" engines.node floor.
 * @param {string} version
 * @param {string} enginesRange
 */
function satisfiesFloor(version, enginesRange) {
  const match = String(enginesRange)
    .trim()
    .match(/^>=\s*(\d+\.\d+\.\d+)$/);
  if (!match) {
    throw new Error(
      `engines.node must be a simple ">=x.y.z" floor (got ${JSON.stringify(enginesRange)}). ` +
        'Update package.json engines.node or extend check-runtime.mjs deliberately.'
    );
  }
  return compareVersions(parseVersion(version), parseVersion(match[1])) >= 0;
}

/**
 * @param {string} nvmrcRaw
 * @returns {{ kind: 'major', major: number } | { kind: 'full', version: string }}
 */
function parseNvmrc(nvmrcRaw) {
  const trimmed = String(nvmrcRaw).trim().replace(/^v/i, '');
  if (/^\d+$/.test(trimmed)) {
    return { kind: 'major', major: Number.parseInt(trimmed, 10) };
  }
  parseVersion(trimmed); // validate
  return { kind: 'full', version: trimmed };
}

/**
 * Map process.platform / arch (+ optional musl) to @rolldown/binding-* package name.
 * @param {string} platform
 * @param {string} arch
 * @param {{ isMusl?: boolean }} [opts]
 */
function rolldownBindingPackage(platform, arch, opts = {}) {
  const { isMusl = false } = opts;

  if (platform === 'win32' && arch === 'x64') return '@rolldown/binding-win32-x64-msvc';
  if (platform === 'win32' && arch === 'arm64') return '@rolldown/binding-win32-arm64-msvc';
  if (platform === 'darwin' && arch === 'x64') return '@rolldown/binding-darwin-x64';
  if (platform === 'darwin' && arch === 'arm64') return '@rolldown/binding-darwin-arm64';
  if (platform === 'linux' && arch === 'x64') {
    return isMusl ? '@rolldown/binding-linux-x64-musl' : '@rolldown/binding-linux-x64-gnu';
  }
  if (platform === 'linux' && arch === 'arm64') {
    return isMusl ? '@rolldown/binding-linux-arm64-musl' : '@rolldown/binding-linux-arm64-gnu';
  }
  if (platform === 'linux' && arch === 'arm') return '@rolldown/binding-linux-arm-gnueabihf';
  if (platform === 'linux' && arch === 'ppc64') return '@rolldown/binding-linux-ppc64-gnu';
  if (platform === 'linux' && arch === 's390x') return '@rolldown/binding-linux-s390x-gnu';
  if (platform === 'freebsd' && arch === 'x64') return '@rolldown/binding-freebsd-x64';
  if (platform === 'android' && arch === 'arm64') return '@rolldown/binding-android-arm64';

  return null;
}

/** Best-effort musl detection for linux hosts. */
function detectMusl() {
  if (process.platform !== 'linux') return false;
  try {
    const report = process.report?.getReport?.();
    const glibc = report?.header?.glibcVersionRuntime;
    if (glibc) return false;
  } catch {
    // ignore
  }
  try {
    const { execSync } = require('node:child_process');
    const out = execSync('ldd --version 2>&1 || true', { encoding: 'utf8' });
    if (/musl/i.test(out)) return true;
  } catch {
    // ignore
  }
  return false;
}

/**
 * @param {object} args
 * @param {string} args.nodeVersion
 * @param {string} args.enginesNode
 * @param {string} args.nvmrcRaw
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
function checkNodeVersion({ nodeVersion, enginesNode, nvmrcRaw }) {
  let floorOk;
  try {
    floorOk = satisfiesFloor(nodeVersion, enginesNode);
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }

  if (!floorOk) {
    return {
      ok: false,
      message:
        `Node ${nodeVersion} does not satisfy engines.node "${enginesNode}" ` +
        `(from package.json; .nvmrc is ${JSON.stringify(String(nvmrcRaw).trim())}).\n` +
        `  Fix: switch to Node >=22.12.0 with your version manager so PATH matches .nvmrc ` +
        `(nvm use / fnm use), or install current Node 22 LTS from nodejs.org.\n` +
        `  Then: remove node_modules and reinstall (rm -rf node_modules; npm ci).\n` +
        `  Do not blindly bump Vite/Vitest or delete tests to work around this.`,
    };
  }

  const nvm = parseNvmrc(nvmrcRaw);
  const [major] = parseVersion(nodeVersion);
  if (nvm.kind === 'major' && major !== nvm.major) {
    return {
      ok: false,
      message:
        `Node ${nodeVersion} major (${major}) does not match .nvmrc major (${nvm.major}).\n` +
        `  Fix: run nvm use / fnm use (or install Node ${nvm.major} LTS) so the active runtime matches .nvmrc.\n` +
        `  Then: remove node_modules and reinstall under that Node.`,
    };
  }
  if (nvm.kind === 'full' && compareVersions(parseVersion(nodeVersion), parseVersion(nvm.version)) < 0) {
    return {
      ok: false,
      message:
        `Node ${nodeVersion} is below .nvmrc pin ${nvm.version}.\n` +
        `  Fix: install/use at least ${nvm.version}, then reinstall node_modules.`,
    };
  }

  return { ok: true };
}

/**
 * @param {object} args
 * @param {string} args.platform
 * @param {string} args.arch
 * @param {boolean} [args.isMusl]
 * @param {(id: string) => string} [args.resolve]
 * @returns {{ ok: true, packageName: string } | { ok: false, message: string, packageName?: string | null }}
 */
function checkRolldownBinding({ platform, arch, isMusl = false, resolve = (id) => require.resolve(id) }) {
  const packageName = rolldownBindingPackage(platform, arch, { isMusl });
  if (!packageName) {
    return {
      ok: false,
      packageName,
      message:
        `No known @rolldown/binding-* mapping for ${platform}/${arch}. ` +
        `Extend rolldownBindingPackage() in check-runtime.mjs if this platform is supported.`,
    };
  }

  try {
    resolve(packageName);
    return { ok: true, packageName };
  } catch {
    return {
      ok: false,
      packageName,
      message:
        `Required Rolldown native binding is missing: ${packageName}\n` +
        `  npm often skips optional native bindings when Node is outside the Vite/Rolldown engine range ` +
        `(^20.19.0 || >=22.12.0) — e.g. Node 22.11.0 on Windows while .nvmrc says 22.\n` +
        `  Fix: use Node >=22.12.0 that matches .nvmrc (nvm use / fnm use), then ` +
        `rm -rf node_modules && npm ci (or npm install).\n` +
        `  Run npm run check:runtime again before vitest.\n` +
        `  Do not fix this by deleting tests or pinning Vite without an engines/.nvmrc decision.`,
    };
  }
}

function readProjectFiles() {
  const pkgPath = join(ROOT, 'package.json');
  const nvmPath = join(ROOT, '.nvmrc');
  if (!existsSync(pkgPath)) {
    fail(`package.json not found at ${pkgPath}`);
    process.exit(1);
  }
  if (!existsSync(nvmPath)) {
    fail(`.nvmrc not found at ${nvmPath}`);
    process.exit(1);
  }
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const enginesNode = pkg.engines?.node;
  if (!enginesNode || typeof enginesNode !== 'string') {
    fail('package.json engines.node is missing or not a string.');
    process.exit(1);
  }
  return { enginesNode, nvmrcRaw: readFileSync(nvmPath, 'utf8') };
}

function runSelfTest() {
  /** @type {Array<[string, () => void]>} */
  const cases = [
    [
      'parseVersion',
      () => {
        const v = parseVersion('v22.11.0');
        if (v[0] !== 22 || v[1] !== 11 || v[2] !== 0) throw new Error(`unexpected ${v}`);
      },
    ],
    [
      'satisfiesFloor accepts 22.12.0',
      () => {
        if (!satisfiesFloor('22.12.0', '>=22.12.0')) throw new Error('expected pass');
      },
    ],
    [
      'satisfiesFloor rejects 22.11.0',
      () => {
        if (satisfiesFloor('22.11.0', '>=22.12.0')) throw new Error('expected fail');
      },
    ],
    [
      'checkNodeVersion rejects engine gap',
      () => {
        const r = checkNodeVersion({
          nodeVersion: '22.11.0',
          enginesNode: '>=22.12.0',
          nvmrcRaw: '22\n',
        });
        if (r.ok) throw new Error('expected fail');
      },
    ],
    [
      'checkNodeVersion rejects major mismatch',
      () => {
        const r = checkNodeVersion({
          nodeVersion: '20.20.2',
          enginesNode: '>=22.12.0',
          nvmrcRaw: '22',
        });
        if (r.ok) throw new Error('expected fail');
      },
    ],
    [
      'checkNodeVersion accepts good Node',
      () => {
        const r = checkNodeVersion({
          nodeVersion: '22.12.0',
          enginesNode: '>=22.12.0',
          nvmrcRaw: '22',
        });
        if (!r.ok) throw new Error(r.message);
      },
    ],
    [
      'rolldownBindingPackage win32-x64',
      () => {
        if (rolldownBindingPackage('win32', 'x64') !== '@rolldown/binding-win32-x64-msvc') {
          throw new Error('win32 mapping wrong');
        }
      },
    ],
    [
      'rolldownBindingPackage linux-x64-gnu',
      () => {
        if (rolldownBindingPackage('linux', 'x64', { isMusl: false }) !== '@rolldown/binding-linux-x64-gnu') {
          throw new Error('linux gnu mapping wrong');
        }
      },
    ],
    [
      'checkRolldownBinding missing package',
      () => {
        const r = checkRolldownBinding({
          platform: 'win32',
          arch: 'x64',
          resolve: () => {
            throw new Error('not found');
          },
        });
        if (r.ok) throw new Error('expected fail');
        if (r.packageName !== '@rolldown/binding-win32-x64-msvc') throw new Error('wrong name');
      },
    ],
  ];

  let failed = 0;
  for (const [name, fn] of cases) {
    try {
      fn();
      process.stdout.write(`${PREFIX} self-test ok: ${name}\n`);
    } catch (err) {
      failed += 1;
      process.stderr.write(
        `${PREFIX} self-test FAIL: ${name}: ${err instanceof Error ? err.message : err}\n`
      );
    }
  }

  if (failed) {
    process.stderr.write(`${PREFIX} ${failed} self-test(s) failed.\n`);
    process.exit(1);
  }
  process.stdout.write(`${PREFIX} all self-tests passed.\n`);
}

function parseArgs(argv) {
  let selfTest = false;
  let skipBinding = false;
  let simulateMissingBinding = false;
  /** @type {string | null} */
  let nodeVersion = null;
  for (const arg of argv) {
    if (arg === '--self-test') selfTest = true;
    else if (arg === '--skip-binding') skipBinding = true;
    else if (arg === '--simulate-missing-binding') simulateMissingBinding = true;
    else if (arg.startsWith('--node-version=')) nodeVersion = arg.slice('--node-version='.length);
  }
  return { selfTest, skipBinding, simulateMissingBinding, nodeVersion };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.selfTest) {
    runSelfTest();
    return;
  }

  const { enginesNode, nvmrcRaw } = readProjectFiles();
  const nodeVersion = args.nodeVersion || process.versions.node;

  const nodeResult = checkNodeVersion({ nodeVersion, enginesNode, nvmrcRaw });
  if (!nodeResult.ok) {
    fail(nodeResult.message);
    process.exit(1);
  }
  process.stdout.write(`${PREFIX} Node ${nodeVersion} satisfies engines.node "${enginesNode}" and .nvmrc.\n`);

  if (args.skipBinding) {
    process.stdout.write(`${PREFIX} skipping Rolldown binding check (--skip-binding).\n`);
    return;
  }

  const bindingResult = checkRolldownBinding({
    platform: process.platform,
    arch: process.arch,
    isMusl: detectMusl(),
    resolve: args.simulateMissingBinding
      ? () => {
          throw new Error('simulated missing binding');
        }
      : (id) => require.resolve(id),
  });
  if (!bindingResult.ok) {
    fail(bindingResult.message);
    process.exit(1);
  }
  process.stdout.write(`${PREFIX} found ${bindingResult.packageName}.\n`);
}

main();
