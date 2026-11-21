import { expect, test } from 'bun:test';
import { resolve } from 'node:path';

async function bundle(contents: string) {
  const result = await Bun.build({
    entrypoints: ['virtual:components-consumer'],
    target: 'browser',
    tsconfig: resolve(import.meta.dir, '../../../native/tests/fixtures/tsconfig.consumer.json'),
    format: 'esm',
    minify: true,
    external: ['react', 'react/jsx-runtime', 'react-reconciler', 'react-reconciler/*'],
    plugins: [
      {
        name: 'components-consumer',
        setup(build) {
          build.onResolve({ filter: /^virtual:components-consumer$/ }, () => ({ path: 'entry.ts', namespace: 'virtual-components' }));
          build.onLoad({ filter: /.*/, namespace: 'virtual-components' }, () => ({
            contents,
            loader: 'ts',
            resolveDir: resolve(import.meta.dir, '../../..')
          }));
        }
      }
    ]
  });
  if (!result.success) throw new AggregateError(result.logs, 'Consumer build failed');
  return result.outputs[0]!.text();
}

test('NButton excludes unrelated controls, rendering and keyboard coordination', async () => {
  const js = await bundle('export {NButton} from "@nayan-ui/engine/components";');
  expect(js).toContain('NButton');
  for (const marker of [
    'NInputOtp',
    'react-native',
    'react-reconciler',
    '.wasm',
    'DrawingCanvas',
    'keyboardWillShow',
    'keyboardDidShow',
    'focusedInput',
    'focusInput',
    'KeyboardAvoidingView'
  ])
    expect(js).not.toContain(marker);
});

test('the public theme hook excludes platform hosts, renderer and WASM setup', async () => {
  const js = await bundle('export {useNTheme} from "@nayan-ui/engine/components";');
  expect(js).toContain('useNTheme');
  for (const marker of ['.wasm', 'react-native', 'react-reconciler', 'matchMedia', 'drawingCommand', 'DrawingCanvas', 'safe_area_request'])
    expect(js).not.toContain(marker);
});

test('basic controls share the browser platform adapter without pulling in the engine runtime', async () => {
  const js = await bundle('export {NView, NPress, NText} from "@nayan-ui/engine/components";');
  expect(js).toContain('data-nayan-press');
  expect(js).toContain('@layer base');
  for (const marker of ['react-native', 'react-reconciler', '.wasm', 'DrawingCanvas', 'drawingCommand', 'useWindowDimensions'])
    expect(js).not.toContain(marker);
});

test('NPattern exposes only the component facade without game, image or rendering implementations', async () => {
  const js = await bundle('export {NPattern} from "@nayan-ui/engine/components";');
  expect(js).toContain('NPattern');
  for (const marker of ['GAME_PATTERN_RECIPE', 'textureLoad', 'fetch(', 'DrawingCanvas', '.wasm', 'react-reconciler', 'react-native', 'class World'])
    expect(js).not.toContain(marker);
});

test('ComponentsRoot uses the shared surface transport without the drawing editor or world wrapper', async () => {
  const js = await bundle('export {ComponentsRoot} from "@nayan-ui/engine/components";');
  expect(js).toContain('react-reconciler');
  for (const marker of ['DrawingDocument', 'exportSVG', 'captureDraft', 'setEditingEnabled', 'class World', 'react-native'])
    expect(js).not.toContain(marker);
});

test('NImage excludes other widgets and image, network and render code', async () => {
  const js = await bundle('export {NImage} from "@nayan-ui/engine/components";');
  expect(js).toContain('NImage');
  for (const marker of ['fetch(', 'textureLoad', 'react-native', 'react-reconciler', '.wasm', 'World']) expect(js).not.toContain(marker);
  // Shared semantic HTML names are data, not imported widget implementations.
  // Compare against the same built browser facade, including its server fallback.
  for (const name of ['NButton', 'NInput']) expect(js).not.toMatch(new RegExp(`\\w+\\(["']${name}["']\\)`));
  const direct = await bundle(`export {NImage} from ${JSON.stringify(resolve(import.meta.dir, '../../../lib/web/components/NImage.js'))};`);
  expect(js.length).toBeLessThan(direct.length + 768);
});

test('NList from the UI entry excludes the native surface, game runtime and other widgets', async () => {
  const js = await bundle('export {NList} from "@nayan-ui/engine/components";');
  expect(js).toContain('NListItem');
  for (const marker of ['react-native', 'react-reconciler', '.wasm', 'DrawingCanvas', 'NInputOtp']) expect(js).not.toContain(marker);
  expect(js).not.toMatch(/\w+\(["']NButton["']\)/);
});

test('NCarousel from the UI entry excludes timers, the native surface and other controls', async () => {
  const js = await bundle('export {NCarousel} from "@nayan-ui/engine/components";');
  expect(js).toContain('NCarousel');
  for (const marker of ['NList', 'setInterval', 'setTimeout', 'react-native', 'react-reconciler', '.wasm', 'World']) expect(js).not.toContain(marker);
  expect(js).not.toMatch(/\w+\(["']NInput["']\)/);
  const direct = await bundle(`export {NCarousel} from ${JSON.stringify(resolve(import.meta.dir, '../../../lib/web/components/NCarousel.js'))};`);
  expect(js.length).toBeLessThan(direct.length + 768);
});

test('NLoading is one shared facade without JS animation or platform-specific loading code', async () => {
  const js = await bundle('export {NLoading} from "@nayan-ui/engine/components";');
  expect(js).toContain('NLoading');
  for (const marker of ['setInterval', 'setTimeout', 'requestAnimationFrame', 'animateTransform', 'react-native', 'react-reconciler', '.wasm'])
    expect(js).not.toContain(marker);
});

test('NBlur uses the browser/Rust adapter without importing native capture, game runtime or Expo', async () => {
  const js = await bundle('export {NBlur, NBlurTarget} from "@nayan-ui/engine/components";');
  expect(js).toContain('backdropFilter');
  for (const marker of ['react-native', 'expo-blur', 'requireNativeComponent', 'DrawingCanvas', 'react-reconciler', '.wasm'])
    expect(js).not.toContain(marker);
});
