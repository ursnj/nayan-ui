import { existsSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { copyFile, cp, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { lucidePaths } from '../src/components/icons/lucide';

const root = resolve(import.meta.dir, '..');
// Native and website builds can request this package concurrently. One writer owns the generated
// JS/declaration directory until normalization finishes; otherwise another build can delete it.
const buildLock = resolve(root, 'lib/.web-build-lock');
await mkdir(resolve(root, 'lib'), { recursive: true });
for (;;) {
  try {
    await mkdir(buildLock);
    writeFileSync(resolve(buildLock, 'pid'), String(process.pid));
    process.once('exit', () => rmSync(buildLock, { recursive: true, force: true }));
    break;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    try {
      const owner = Number(readFileSync(resolve(buildLock, 'pid'), 'utf8'));
      if (owner > 0) {
        try {
          process.kill(owner, 0);
        } catch (error) {
          if (error.code === 'ESRCH') rmSync(buildLock, { recursive: true, force: true });
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      try {
        if (Date.now() - statSync(buildLock).mtimeMs > 30000) rmSync(buildLock, { recursive: true, force: true });
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    await Bun.sleep(100);
  }
}

const { exports: publicExports } = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const sourceEntries = new Map();
for (const entry of Object.values(publicExports)) {
  const source = entry['react-native']?.source;
  const web = entry.browser?.default ?? entry.default;
  if (source?.startsWith('./src/') && web === source.replace('./src/', './lib/web/').replace(/\.tsx?$/, '.js')) {
    sourceEntries.set(source, resolve(root, web));
  }
}
const clientEntries = new Set(
  [...sourceEntries].filter(([source]) => source !== './src/index.ts' && source !== './src/native/core.ts').map(([, output]) => output)
);
// From empty, so nothing from an earlier build (a module since removed) is shipped
await rm(resolve(root, 'lib/web'), { recursive: true, force: true });
await mkdir(resolve(root, 'lib/web'), { recursive: true });
const result = await Bun.build({
  entrypoints: [
    ...[...sourceEntries.keys()].map((source) => resolve(root, source)),
    // Private build boundaries keep renderer imports out of consumers using only controls.
    resolve(root, 'src/components/ComponentsRoot.tsx'),
    ...(await readdir(resolve(root, 'src/components')))
      .filter((name) => /^N.*(?<!\.web)\.tsx?$/.test(name) && !['NToastHost.tsx', 'NPlatformView.tsx'].includes(name))
      .map((name) => resolve(root, 'src/components', name))
  ],
  root: resolve(root, 'src'),
  splitting: true,
  // Library consumers handle loading; preload registration would survive tree shaking.
  modulePreload: false,
  outdir: resolve(root, 'lib/web'),
  target: 'browser',
  format: 'esm',
  jsx: { runtime: 'automatic', development: false },
  external: ['react', 'react/jsx-runtime', 'react-reconciler', 'react-reconciler/*'],
  sourcemap: 'external',
  plugins: [
    {
      name: 'engine-web',
      setup(build) {
        build.onResolve({ filter: /native\/core\/build\/web\/engine_core\.js$/ }, () => ({
          path: 'nayan-ui/wasm-runtime',
          external: true
        }));
        build.onResolve({ filter: /^\./ }, ({ importer, path }) => {
          if (extname(path) || !importer.startsWith(resolve(root, 'src') + '/')) return;
          const base = resolve(dirname(importer), path);
          for (const extension of ['.web.ts', '.web.tsx']) {
            const candidate = base + extension;
            if (existsSync(candidate)) return { path: candidate };
          }
        });
      }
    }
  ]
});
if (!result.success) throw new AggregateError(result.logs, 'Browser build failed');
// Bundling can move React implementations into shared chunks and drop the original directive.
// Keep public UI boundaries explicit for Next.js / React Server Components consumers.
for (const entry of result.outputs) {
  if (!entry.path.endsWith('.js')) continue;
  const source = await readFile(entry.path, 'utf8');
  const client = /^(?:["']use client["']);?$/m.test(source) || /\/components\//.test(entry.path) || clientEntries.has(entry.path);
  const normalized = source.replace(/^["']use client["'];?\r?\n/gm, '');
  await writeFile(entry.path, `${client ? "'use client';\n" : ''}${normalized}`);
}

// Direct icon imports resolve to separate data modules even in bundlers without tree shaking.
const iconDirectory = resolve(root, 'lib/web/components/icons/paths');
const namedIconDirectory = resolve(root, 'lib/web/components/icons/named');
await mkdir(iconDirectory, { recursive: true });
await mkdir(resolve(namedIconDirectory, 'components'), { recursive: true });
await writeFile(resolve(iconDirectory, 'package.json'), '{"type":"module"}\n');
await writeFile(resolve(namedIconDirectory, 'package.json'), '{"type":"module"}\n');
await copyFile(resolve(root, 'src/components/icons/LICENSE.lucide'), resolve(iconDirectory, 'LICENSE.lucide'));
const namedIcons = new Map();
for (const [name, paths] of Object.entries(lucidePaths)) {
  const outline = JSON.stringify({ paths, viewBox: 24, strokeWidth: 2 });
  await writeFile(resolve(iconDirectory, `${name}.js`), `// Lucide, ISC license (see LICENSE.lucide)\nexport default ${outline};\n`);
  await writeFile(
    resolve(iconDirectory, `${name}.d.ts`),
    'declare const outline: Readonly<{ paths: readonly string[]; viewBox: 24; strokeWidth: 2 }>;\nexport default outline;\n'
  );

  const exported =
    name
      .split('-')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join('') + 'Icon';
  if (!/^[A-Z][A-Za-z0-9]*Icon$/.test(exported)) throw new Error(`Invalid named icon export: ${name}`);
  const previous = namedIcons.get(exported);
  // Digit-separated Lucide aliases can normalize to the same component name.
  if (previous && JSON.stringify(lucidePaths[previous]) !== JSON.stringify(paths)) {
    throw new Error(`Named icon export collision: ${previous}, ${name}`);
  }
  if (!previous || name.length < previous.length) namedIcons.set(exported, name);

  await writeFile(
    resolve(namedIconDirectory, 'components', `${name}.js`),
    `'use client';\nimport { createElement } from 'react';\nimport { NPathIcon } from 'nayan-ui/icons/outline';\n` +
      `import outline from '../../paths/${name}.js';\n` +
      `export function ${exported}({ strokeWidth = outline.strokeWidth, ...props }) {\n` +
      `  return createElement(NPathIcon, { ...props, ...outline, strokeWidth });\n}\n`
  );
  await writeFile(
    resolve(namedIconDirectory, 'components', `${name}.d.ts`),
    `import type { ReactElement } from 'react';\nimport type { NIconProps } from 'nayan-ui/icons/outline';\n` +
      `export declare function ${exported}(props: Omit<NIconProps, 'name' | 'paths' | 'viewBox'>): ReactElement;\n`
  );
}
const iconExports = [...namedIcons].map(([exported, name]) => `export { ${exported} } from './components/${name}.js';`).join('\n');
await writeFile(resolve(namedIconDirectory, 'index.js'), `'use client';\n${iconExports}\n`);
await writeFile(resolve(namedIconDirectory, 'index.d.ts'), `${iconExports}\n`);

// Keep the public barrel separate from the UI's internal catalogue entry.
for (const [file, catalogue] of Object.entries({
  'web.js': '../index.js',
  'native.js': '../../../../module/components/icons/index.js',
  'native-source.js': '../../../../../src/components/icons/index.ts',
  'web.d.ts': '../../../types/src/components/icons/index.js',
  'native.d.ts': '../../../../typescript/src/components/icons/index.js'
})) {
  const exports = file.endsWith('.d.ts') ? 'NIcon, lucideIcon, type NIconName, type NIconProps' : 'NIcon, lucideIcon';
  const directive = file.endsWith('.d.ts') ? '' : "'use client';\n";
  await writeFile(resolve(namedIconDirectory, file), `${directive}export { ${exports} } from '${catalogue}';\nexport * from './index.js';\n`);
}
const server = await Bun.build({
  entrypoints: [resolve(root, 'src/markdown/server.tsx')],
  outdir: resolve(root, 'lib/web/markdown'),
  target: 'node',
  format: 'esm',
  external: ['node:fs', 'react'],
  plugins: [
    {
      name: 'markdown-client-boundary',
      setup(build) {
        build.onResolve({ filter: /^\.\/NMarkdown\.web$/ }, () => ({ path: './index.js', external: true }));
      }
    }
  ]
});
if (!server.success) throw new AggregateError(server.logs, 'Markdown server build failed');
for (const artifact of server.outputs) {
  if (artifact.path.endsWith('.js'))
    await writeFile(artifact.path, (await artifact.text()).replaceAll('../../native/core/build/web/engine_core_bg.wasm', '../engine_core_bg.wasm'));
}
const wasmDir = resolve(root, 'native/core/build/web');
const sqliteWorker = await Bun.build({
  entrypoints: [resolve(root, 'src/sqlite/worker.ts')],
  outdir: resolve(root, 'lib/web'),
  naming: 'sqlite-worker.js',
  target: 'browser',
  format: 'esm',
  plugins: [
    {
      name: 'sqlite-worker-runtime',
      setup(build) {
        build.onResolve({ filter: /native\/core\/build\/web\/engine_core\.js$/ }, () => ({
          path: 'nayan-ui/wasm-runtime',
          external: true
        }));
      }
    }
  ]
});
if (!sqliteWorker.success) throw new AggregateError(sqliteWorker.logs, 'SQLite worker build failed');
await copyFile(resolve(wasmDir, 'engine_core_bg.wasm'), resolve(root, 'lib/web/engine_core_bg.wasm'));
await copyFile(resolve(wasmDir, 'engine_core.js'), resolve(root, 'lib/web/wasm-runtime.js'));
await cp(resolve(wasmDir, 'snippets'), resolve(root, 'lib/web/snippets'), { recursive: true });
const styles = await Bun.build({
  entrypoints: [resolve(root, 'src/styles/index.ts')],
  outdir: resolve(root, 'lib/web/styles'),
  target: 'node',
  format: 'esm',
  external: ['lightningcss']
});
if (!styles.success) throw new AggregateError(styles.logs, 'Engine style compiler build failed');

await copyFile(resolve(root, 'src/audio/audio-worklet.js'), resolve(root, 'lib/web/audio-worklet.js'));
// Remove declarations for source files deleted since the last build.
await rm(resolve(root, 'lib/web/types'), { recursive: true, force: true });
const types = Bun.spawn(['bun', 'x', 'tsc', '-p', resolve(root, 'tsconfig.web.json')], { cwd: root, stdout: 'inherit', stderr: 'inherit' });
if ((await types.exited) !== 0) throw new Error('Browser declarations failed');
// Ensure a plain React consumer never needs React Native at runtime.
const bundle = await Bun.file(resolve(root, 'lib/web/index.js')).text();
if (/from ["']react-native["']|require\(["']react-native["']\)/.test(bundle)) throw new Error('React Native leaked into browser bundle');
console.log('Built React browser entry, WASM core, audio worklet and declarations.');

// Consumers need no platform-specific TypeScript resolver settings.
async function normalizeDeclarations(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await normalizeDeclarations(path);
    else if (entry.name.endsWith('.d.ts')) {
      const source = await readFile(path, 'utf8');
      await writeFile(path, source.replace(/\.web(["'])/g, '$1'));
      if (entry.name.endsWith('.web.d.ts')) await rename(path, path.replace(/\.web\.d\.ts$/, '.d.ts'));
    }
  }
}
await normalizeDeclarations(resolve(root, 'lib/web/types'));
