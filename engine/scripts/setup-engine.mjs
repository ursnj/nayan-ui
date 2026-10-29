import { access, mkdir, readFile, rename, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = process.argv[2];
if (!source)
  throw new Error(
    "Usage: bun run setup /absolute/path/to/playtura/packages/engine\nBuild the engine's native and browser outputs first (see README.md)."
  );
const engine = resolve(source);
const manifest = JSON.parse(await readFile(resolve(engine, 'package.json'), 'utf8'));
if (manifest.name !== '@nayan-ui/engine' || !manifest.exports?.['./web']) {
  throw new Error('Use a current @nayan-ui/engine checkout with browser support.');
}
const requiredFiles = [
  'lib/module/index.js',
  'lib/typescript/src/index.d.ts',
  'lib/web/index.js',
  'lib/web/engine_core_bg.wasm',
  'lib/web/audio-worklet.js',
  'src/index.ts',
  'src/native/spec/NativeNayanEngine.ts'
];
for (const artifact of requiredFiles) {
  try {
    await access(resolve(engine, artifact));
  } catch {
    throw new Error(`Missing ${artifact}. Run the engine build before setup.`);
  }
}
const destination = resolve(root, '.engine');
await mkdir(destination, { recursive: true });
const result = spawnSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', destination], {
  cwd: engine,
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024
});
if (result.status !== 0) throw new Error(result.stderr || result.stdout);
const [packed] = JSON.parse(result.stdout);
const packedFiles = new Set(packed.files.map((file) => file.path));
const missing = requiredFiles.filter((file) => !packedFiles.has(file));
if (missing.length) {
  await rm(resolve(destination, packed.filename), { force: true });
  throw new Error(
    `Engine archive is missing required files:\n${missing.join('\n')}\nUpdate the engine package.json files list to include src and the built lib outputs, then rerun setup. React Native Codegen requires the original TypeScript spec.`
  );
}
const archive = resolve(destination, 'nayan-ui-engine.tgz');
await rename(resolve(destination, packed.filename), archive);
console.log('Engine packaged in .engine/nayan-ui-engine.tgz. Run bun install from engine/.');
