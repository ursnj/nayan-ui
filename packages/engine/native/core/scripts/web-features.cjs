const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { selectFeatures } = require('../../../scripts/features.cjs');
const nativeRoot = resolve(__dirname, '../..');
const core = join(nativeRoot, 'core');

function fingerprint(profile) {
  const hash = createHash('sha256').update(profile);
  function add(relative) {
    const entry = join(nativeRoot, relative);
    for (const child of readdirSync(entry, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const childPath = join(relative, child.name);
      if (child.isDirectory()) add(childPath);
      else if (child.isFile()) hash.update(childPath).update(readFileSync(join(nativeRoot, childPath)));
    }
  }
  add(join('core', 'src'));
  add(join('core', 'scripts'));
  for (const feature of readdirSync(nativeRoot).sort()) {
    const rust = join(feature, 'rust');
    if (existsSync(join(nativeRoot, rust))) add(rust);
  }
  hash.update(readFileSync(join(core, 'Cargo.toml'))).update(readFileSync(join(core, 'Cargo.lock')));
  return hash.digest('hex').slice(0, 24);
}

function buildWasm(profile, cache) {
  const key = fingerprint(profile);
  const output = join(cache, key);
  const entry = join(output, 'engine_core.js');
  if (existsSync(entry)) return entry;
  mkdirSync(cache, { recursive: true });
  const staging = mkdtempSync(join(cache, 'build-'));
  try {
    const result = spawnSync('bash', [join(core, 'scripts/build-web.sh')], {
      cwd: core,
      env: {
        ...process.env,
        NAYAN_ENGINE_FEATURES: profile,
        CARGO_TARGET_DIR: join(cache, 'cargo', createHash('sha256').update(profile).digest('hex').slice(0, 24)),
        NAYAN_ENGINE_WASM_OUT: staging
      },
      stdio: 'inherit'
    });
    if (result.error || result.status !== 0) throw new Error('Nayan Engine could not build the selected WASM features.', { cause: result.error });
    try {
      renameSync(staging, output);
    } catch (error) {
      if (!existsSync(entry)) throw error;
    }
    return entry;
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

/** Build or retrieve the WASM binding for use in a browser bundler's resolver. */
function resolveWasmRuntime(features, { cacheDirectory = 'node_modules/.cache/nayan-engine' } = {}) {
  return buildWasm(selectFeatures(features), resolve(cacheDirectory));
}

/** Install the selected runtime before Vite resolves the engine's browser modules. */
function nayanEngine({ features }) {
  const profile = selectFeatures(features);
  let cache;
  let entry;
  function resolveId(source) {
    if (source === '@nayan-ui/engine/wasm-runtime') return (entry ??= buildWasm(profile, cache));
  }
  return {
    name: 'nayan-engine-features',
    enforce: 'pre',
    configResolved(config) {
      cache = resolve(config.cacheDir, 'nayan-engine');
    },
    config(config = {}) {
      const workerPlugins = config.worker?.plugins;
      return {
        optimizeDeps: { exclude: ['@nayan-ui/engine'] },
        worker: {
          plugins() {
            return [...(workerPlugins?.() ?? []), { name: 'nayan-engine-worker-features', enforce: 'pre', resolveId }];
          }
        }
      };
    },
    resolveId
  };
}

exports.nayanEngine = nayanEngine;
exports.resolveWasmRuntime = resolveWasmRuntime;
