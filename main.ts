// Token radar entrypoint (Node 22, standard library only).
//
// Reads the sealed snapshot, scores every rankable pre-token protocol with
// the fitted model in lib/model.ts, and writes the ranked board, the
// dashboard's data, the page and the screenshots to the output directory,
// then the dossier the judge reads.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../input/snapshot.json
//
// --input takes a snapshot.json file or the directory holding it (default
// /input); --output or MAKEFUN_OUTPUT_DIR takes the output directory
// (default /output). The run is deterministic: the same snapshot bytes give
// the same output bytes, with no clock, no randomness and no network
// anywhere.

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boardIssue, buildRadar, dataScript, parseSnapshot } from './lib/model.ts';
import { buildDossier } from './vendor/makefun-board.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));

/** The caps the scorer itself applies to the dossier's text and screenshots. */
const TEXT_MAX_BYTES = 65_536;
const SCREENSHOT_LIMIT = { max: 4, max_bytes: 524_288 };
const DASHBOARD_LIMIT = { max_files: 400, max_bytes: 4_194_304 };
const PLAIN_NAME = /^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/;

/** Fail with a message on stderr and a non-zero exit. */
function fail(message: string, code = 1): never {
  process.stderr.write(`token radar: ${message}\n`);
  process.exit(code);
}

/** The value of `--name <value>` or `--name=<value>`, else `fallback`. */
function flag(name: string, fallback: string): string {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === `--${name}` && i + 1 < args.length) return args[i + 1]!;
    if (a.startsWith(`--${name}=`)) return a.slice(name.length + 3);
  }
  return fallback;
}

const inputArg = flag('input', '/input');
const snapshotPath = inputArg.endsWith('.json') ? inputArg : join(inputArg, 'snapshot.json');
if (!existsSync(snapshotPath)) {
  fail(`no snapshot at ${snapshotPath}: pass --input <snapshot.json|directory> or mount the sealed /input`, 2);
}
const outDir = resolve(flag('output', process.env.MAKEFUN_OUTPUT_DIR ?? '/output'));

let snapshotText: string;
try {
  snapshotText = readFileSync(snapshotPath, 'utf8');
} catch {
  fail(`cannot read ${snapshotPath}`, 2);
}
const snapshot = parseSnapshot(snapshotText);
const { board, radar } = buildRadar(snapshot);
const issue = boardIssue(board, snapshot);
if (issue !== null) fail(`the model wrote a board the gate refuses: ${issue}`);

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'board.json'), `${JSON.stringify({ rows: board })}\n`);
writeFileSync(join(outDir, 'data.js'), dataScript(radar));

/**
 * Copy a directory tree into `to`, skipping dot-names at every level and every
 * entry that is not a regular file or directory. Returns the copied file paths,
 * relative to `from`, in sorted order.
 */
function copyTree(from: string, to: string): string[] {
  if (!existsSync(from)) return [];
  const copied: string[] = [];
  const walk = (dir: string, rel: string): void => {
    mkdirSync(join(to, rel), { recursive: true });
    for (const name of readdirSync(dir).sort()) {
      if (name.startsWith('.')) continue;
      const src = join(dir, name);
      const dstRel = rel === '' ? name : `${rel}/${name}`;
      const st = statSync(src);
      if (st.isDirectory()) walk(src, dstRel);
      else if (st.isFile()) {
        copyFileSync(src, join(to, dstRel));
        copied.push(dstRel);
      }
    }
  };
  walk(from, '');
  return copied;
}

const dashboardFiles = copyTree(join(repoRoot, 'dashboard'), join(outDir, 'dashboard'));
if (dashboardFiles.length === 0 || !dashboardFiles.includes('index.html')) {
  fail('dashboard/ holds no index.html: the page is what the judge reads', 1);
}
const shots = copyTree(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));
if (shots.length < 3) {
  fail(`screenshots/ holds ${shots.length} image${shots.length === 1 ? '' : 's'}: hand in 3, the board, a detail view and a filtered view`, 1);
}
for (const name of shots) {
  if (!PLAIN_NAME.test(name)) fail(`screenshots/${name}: a name is letters, digits and . _ -, 1 to 128 characters`, 1);
}

// The dossier is written last: the scorer rebuilds it from this output and compares bytes.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, { text_max_bytes: TEXT_MAX_BYTES, screenshots: SCREENSHOT_LIMIT, dashboard: DASHBOARD_LIMIT }),
);

process.stdout.write(
  `token radar: ${snapshot.protocols.length} protocols, ${snapshot.watchlist.length} on the watchlist, ${board.length} rows scored (${radar.set_aside_size} set aside, ${radar.live_size} live set aside)\n` +
    `token radar: wrote ${join(outDir, 'board.json')}, ${join(outDir, 'data.js')}, ${join(outDir, 'dashboard')} (${dashboardFiles.length} files), ${join(outDir, 'screenshots')} (${shots.length} images) and ${join(outDir, 'dossier.json')}\n`,
);
