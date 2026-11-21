import { expect, test } from 'bun:test';
import { resolve } from 'node:path';
import { nayanEngine } from '../../native/core/scripts/web-features.cjs';
import metadata from '../../package.json';

async function bundle(contents: string, native = false, treeShaking = true) {
  const result = await Bun.build({
    entrypoints: ['virtual:feature-consumer'],
    target: 'browser',
    // Resolve the published exports, bypassing the engine's local root-source alias.
    tsconfig: resolve(import.meta.dir, '../../native/tests/fixtures/tsconfig.consumer.json'),
    conditions: native ? ['react-native', 'source'] : ['browser'],
    format: 'esm',
    minify: true,
    treeShaking,
    external: ['react', 'react/jsx-runtime', 'react-reconciler', 'react-reconciler/*', 'react-native'],
    plugins: [
      {
        name: 'feature-consumer',
        setup(build) {
          build.onResolve({ filter: /^virtual:feature-consumer$/ }, () => ({ path: 'entry.ts', namespace: 'feature' }));
          build.onLoad({ filter: /.*/, namespace: 'feature' }, () => ({ contents, loader: 'ts', resolveDir: resolve(import.meta.dir, '../..') }));
        }
      }
    ]
  });
  if (!result.success) throw new AggregateError(result.logs, 'Feature consumer build failed');
  return result.outputs[0]!.text();
}

test('storage and UUID direct entries exclude image picking even with tree shaking disabled', async () => {
  const entries = 'export {createStorage} from "@nayan-ui/engine/storage"; export {uuid} from "@nayan-ui/engine/uuid";';
  const web = await bundle(entries, false, false);
  const native = await bundle(entries, true, false);
  expect(web).toContain('localStorage');
  expect(web).toContain('getRandomValues');
  expect(native).toContain('storageRequest');
  for (const js of [web, native]) {
    for (const marker of ['.wasm', 'pickFromLibrary', 'image.camera', 'DrawingCanvas', 'AudioContext', 'createWorld'])
      expect(js).not.toContain(marker);
  }
});

test('the core entry leaves feature wrappers out without tree shaking', async () => {
  for (const native of [false, true]) {
    const core = await bundle('export {prepareCore} from "@nayan-ui/engine/core";', native, false);
    expect(core).toContain('prepareCore');
    for (const marker of ['IndexedDB', 'AudioContext', 'ReactReconciler', 'createWorld', 'DrawingDocument', 'pickFromLibrary'])
      expect(core).not.toContain(marker);
  }
});

test('the image picker is a standalone entry on both targets', async () => {
  for (const native of [false, true]) {
    const js = await bundle('export {imagePicker} from "@nayan-ui/engine/image-picker";', native, false);
    expect(js).toContain('pickFromLibrary');
    expect(js).not.toContain('.wasm');
    expect(js).not.toContain('DrawingCanvas');
  }
});

test('direct games and drawing entries exclude the picker without tree shaking', async () => {
  const entries = 'export {World, GameView} from "@nayan-ui/engine/games"; export {DrawingDocument} from "@nayan-ui/engine/drawing";';
  for (const native of [false, true]) {
    const js = await bundle(entries, native, false);
    expect(js).toContain('createWorld');
    expect(js).toContain('drawingCreate');
    expect(js).not.toContain('pickFromLibrary');
    expect(js).not.toContain('image.camera');
  }
});

test('the animations entry bundles without initializing a world or renderer', async () => {
  for (const native of [false, true]) {
    const js = await bundle('export {animations} from "@nayan-ui/engine/animations";', native, false);
    for (const method of [
      'animate',
      'animateView',
      'playView',
      'captureSharedElement',
      'transitionSharedElement',
      'stopAnimation',
      'playClip',
      'stopClip'
    ])
      expect(js).toContain(method);
    for (const marker of ['createWorld', 'GameView', 'AudioContext', '.wasm']) expect(js).not.toContain(marker);
    const view = await bundle('export {AnimationView, useSharedValue, useAnimatedStyle, withTiming} from "@nayan-ui/engine/animations";', native);
    expect(view).toContain(native ? 'useNativeDriver' : 'registerProperty');
    if (!native) expect(view).not.toContain('react-native');
  }
});

test('the location entry uses the platform provider without initializing games or audio', async () => {
  for (const native of [false, true]) {
    const js = await bundle('export {location, LocationError} from "@nayan-ui/engine/location";', native);
    expect(js).toContain('watchPosition');
    expect(js).toContain(native ? 'location.next' : 'location_position');
    for (const marker of ['createWorld', 'AudioContext', 'react-reconciler']) expect(js).not.toContain(marker);
  }
});

test('browser TTS excludes game wrappers, UI, drawing and audio device setup', async () => {
  const js = await bundle('export {speech} from "@nayan-ui/engine/modules";');
  expect(js).toContain('speechSynthesis');
  for (const marker of ['react-native', 'react-reconciler', 'warmUpEngine', 'DrawingCanvas', 'AudioContext', 'engine-microphone', 'createWorld']) {
    expect(js).not.toContain(marker);
  }
});

test('native TTS resolves its platform bridge without browser or game dependencies', async () => {
  const js = await bundle('export {speech} from "@nayan-ui/engine/modules";', true);
  expect(js).toContain('speechRequest');
  for (const marker of ['.wasm', 'speechSynthesis', 'warmUpEngine', 'react-reconciler', 'DrawingCanvas', 'AudioContext']) {
    expect(js).not.toContain(marker);
  }
});

test('the games barrel tree shakes unused renderers and other feature groups', async () => {
  const js = await bundle('export {toColor} from "@nayan-ui/engine/games";');
  expect(js).toContain('toColor');
  for (const marker of ['.wasm', 'react-native', 'react-reconciler', 'DrawingCanvas', 'SpeechSynthesisUtterance', 'AudioContext', 'NButton']) {
    expect(js).not.toContain(marker);
  }
});

test('drawing and audio entry points expose their public APIs', async () => {
  const drawing = await bundle('export {DrawingCanvas, DrawingDocument} from "@nayan-ui/engine/drawing";');
  expect(drawing).toContain('DrawingCanvas');
  expect(drawing).toContain('DrawingDocument');
  expect(drawing).not.toContain('react-reconciler');
  const audio = await bundle('export {audio, microphone, haptics} from "@nayan-ui/engine/modules";');
  expect(audio).toContain('microphone');
  expect(audio).toContain('haptics');
  expect(audio).not.toContain('DrawingCanvas');
  expect(audio).not.toContain('react-reconciler');
});

test('the compatibility entry still exposes every previous feature group', async () => {
  const js = await bundle('export {World, GameView, DrawingCanvas, DrawingDocument, audio, microphone, haptics, speech} from "@nayan-ui/engine";');
  for (const name of ['World', 'GameView', 'DrawingCanvas', 'DrawingDocument', 'audio', 'microphone', 'haptics', 'speech']) {
    expect(js).toContain(name);
  }
});

test('components have a single public entry', () => {
  expect(Object.keys(metadata.exports).filter((path) => /^\.\/components(?:$|[-/])/.test(path))).toEqual(['./components']);
});

test('components expose the surface, controls and built-in icons with tree shaking disabled', async () => {
  for (const native of [false, true]) {
    const ui = await bundle('export * from "@nayan-ui/engine/components";', native, false);
    for (const marker of ['NButton', 'NIcon', 'chevron-right', 'componentCreate']) expect(ui).toContain(marker);
    for (const marker of ['lucideIcon', 'a-arrow-down', 'M3.304 13h6.392', 'NMarkdown', 'Drawing operation failed']) expect(ui).not.toContain(marker);
  }
});

test('Markdown has an independent public entry on both platforms', async () => {
  for (const native of [false, true]) {
    const markdown = await bundle('export {NMarkdown, parseFrontMatter} from "@nayan-ui/engine/markdown";', native, false);
    expect(markdown).toContain('NMarkdown');
    expect(markdown).toContain('parseFrontMatter');
    expect(markdown).not.toContain('a-arrow-down');
  }
});

test.each([false, true])(
  'the legacy icons entry bundles the Lucide catalog (native: %s)',
  async (native) => {
    const icons = await bundle('export {NIcon, lucideIcon} from "@nayan-ui/engine/icons";', native, false);
    expect(icons).toContain('a-arrow-down');
    expect(icons).not.toContain('NMarkdown');
    expect(icons).not.toContain('Drawing operation failed');
  },
  30000
);

test('the catalogue entry exposes dynamic lookup without the named component modules', async () => {
  for (const native of [false, true]) {
    const icons = await bundle('export {NIcon, lucideIcon} from "@nayan-ui/engine/icons/catalog";', native, false);
    expect(icons).toContain('a-arrow-down');
    expect(icons).not.toContain('HeartIcon');
    expect(icons).not.toContain('SearchIcon');
  }
});

test('direct icon paths and the outline renderer exclude the catalogue without tree shaking', async () => {
  for (const native of [false, true]) {
    const icons = await bundle(
      'export {default as heart} from "@nayan-ui/engine/icons/heart"; export {NPathIcon} from "@nayan-ui/engine/icons/outline";',
      native,
      false
    );
    expect(icons).toContain('NPathIcon');
    expect(icons).toContain('M2 9.5a5.5 5.5');
    expect(icons).not.toContain('a-arrow-down');
  }
});

test.each([
  ['icons', false],
  ['icons', true],
  ['icons/named', false],
  ['icons/named', true]
] as const)(
  'named icon components retain only requested paths from %s (native: %s)',
  async (entry, native) => {
    const js = await bundle(`export {HeartIcon, SearchIcon} from "@nayan-ui/engine/${entry}";`, native);
    expect(js).toContain('M2 9.5a5.5 5.5');
    expect(js).toContain('m21 21-4.34-4.34');
    expect(js).not.toContain('M3.304 13h6.392');
    expect(js).not.toContain('a-arrow-down');
  },
  30000
);

test('an individual named component omits other outlines even without tree shaking', async () => {
  for (const native of [false, true]) {
    const js = await bundle('export {HeartIcon} from "@nayan-ui/engine/icons/components/heart";', native, false);
    expect(js).toContain('HeartIcon');
    expect(js).toContain('M2 9.5a5.5 5.5');
    expect(js).not.toContain('m21 21-4.34-4.34');
    expect(js).not.toContain('a-arrow-down');
  }
});

test('SQLite workers use the selected WASM resolver alongside existing worker plugins', async () => {
  expect(Object.keys(metadata.exports)).not.toContain('./web-features');
  const worker = await Bun.file(resolve(import.meta.dir, '../../lib/web/sqlite-worker.js')).text();
  expect(worker).toContain('@nayan-ui/engine/wasm-runtime');
  expect(worker).not.toContain('./wasm-runtime.js');

  const feature = nayanEngine({ features: ['sqlite'] });
  const existing = { name: 'existing-worker-plugin' };
  const plugins = feature.config({ worker: { plugins: () => [existing] } }).worker.plugins();
  expect(plugins[0]).toBe(existing);
  expect(plugins[1]).toMatchObject({ resolveId: feature.resolveId });
});

test('the root and modules alias expose the shared services', async () => {
  const names = ['animations', 'audio', 'haptics', 'location', 'microphone', 'createStorage', 'useStorage', 'speech', 'uuid'];
  for (const entry of ['@nayan-ui/engine', '@nayan-ui/engine/modules']) {
    const js = await bundle(`export {${names.join(', ')}} from "${entry}";`);
    for (const name of names) expect(js).toContain(name);
  }
});

test('storage-only browser consumers exclude game, audio, speech and WASM initialization', async () => {
  const js = await bundle('export {createStorage, useStorage} from "@nayan-ui/engine/modules";');
  expect(js).toContain('localStorage');
  for (const marker of ['.wasm', 'react-native', 'react-reconciler', 'AudioContext', 'speechSynthesis', 'createWorld', 'DrawingCanvas'])
    expect(js).not.toContain(marker);
});

test('browser connectivity excludes native, WASM and rendering setup', async () => {
  const js = await bundle('export {network, useOnline} from "@nayan-ui/engine/modules";');
  expect(js).toContain('onLine');
  for (const marker of ['.wasm', 'react-native', 'react-reconciler', 'AudioContext', 'speechSynthesis', 'DrawingCanvas'])
    expect(js).not.toContain(marker);
});

test('native connectivity resolves platform observers without HTTP or browser dependencies', async () => {
  const js = await bundle('export {network, useOnline} from "@nayan-ui/engine/modules";', true);
  expect(js).toContain('networkStart');
  expect(js).toContain('networkStop');
  for (const marker of ['.wasm', 'react-reconciler', 'AudioContext', 'speechSynthesis', 'DrawingCanvas']) expect(js).not.toContain(marker);
});

test('clipboard-only browser consumers exclude native, WASM and other module initialization', async () => {
  const js = await bundle('export {clipboard} from "@nayan-ui/engine/modules";');
  expect(js).toContain('writeText');
  expect(js).toContain('readText');
  for (const marker of ['.wasm', 'react-native', 'react-reconciler', 'AudioContext', 'networkStart', 'speechSynthesis', 'DrawingCanvas'])
    expect(js).not.toContain(marker);
});

test('native clipboard resolves its platform bridge without browser or game dependencies', async () => {
  const js = await bundle('export {clipboard} from "@nayan-ui/engine/modules";', true);
  expect(js).toContain('clipboardRequest');
  for (const marker of ['.wasm', 'react-reconciler', 'navigator.clipboard', 'AudioContext', 'networkStart', 'DrawingCanvas'])
    expect(js).not.toContain(marker);
});

test('sharing-only browser consumers exclude native, WASM and other module initialization', async () => {
  const js = await bundle('export {sharing} from "@nayan-ui/engine/modules";');
  expect(js).toContain('canShare');
  for (const marker of ['.wasm', 'react-native', 'react-reconciler', 'AudioContext', 'clipboardRequest', 'DrawingCanvas'])
    expect(js).not.toContain(marker);
});

test('native sharing resolves its platform bridge without browser or game dependencies', async () => {
  const js = await bundle('export {sharing} from "@nayan-ui/engine/modules";', true);
  expect(js).toContain('sharingRequest');
  for (const marker of ['.wasm', 'react-reconciler', 'canShare', 'AudioContext', 'DrawingCanvas']) expect(js).not.toContain(marker);
});

test('browser capture is isolated from native, WASM and rendering initialization', async () => {
  const js = await bundle('export {capture} from "@nayan-ui/engine/modules";');
  expect(js).toContain('getDisplayMedia');
  for (const marker of ['.wasm', 'react-native', 'react-reconciler', 'AudioContext', 'captureRequest', 'DrawingCanvas'])
    expect(js).not.toContain(marker);
});

test('native capture resolves its platform bridge without browser or game initialization', async () => {
  const js = await bundle('export {capture} from "@nayan-ui/engine/modules";', true);
  expect(js).toContain('captureRequest');
  for (const marker of ['.wasm', 'react-reconciler', 'getDisplayMedia', 'AudioContext', 'DrawingCanvas']) expect(js).not.toContain(marker);
});

test('device-only modules exclude rendering, audio and browser fingerprinting on both platforms', async () => {
  const web = await bundle('export {device} from "@nayan-ui/engine/modules";');
  const native = await bundle('export {device} from "@nayan-ui/engine/modules";', true);
  expect(web).toContain('browser');
  expect(native).toContain('deviceEnvironment');
  for (const js of [web, native]) {
    for (const marker of ['.wasm', 'react-reconciler', 'AudioContext', 'DrawingCanvas', 'createWorld', 'userAgent']) expect(js).not.toContain(marker);
  }
  expect(web).not.toContain('react-native');
});

test('temporary-file-only modules exclude rendering, WASM, audio and filesystem SDKs', async () => {
  const browser = await bundle('export {files} from "@nayan-ui/engine/modules";');
  const native = await bundle('export {files} from "@nayan-ui/engine/modules";', true);
  expect(browser).toContain('createObjectURL');
  expect(native).toContain('fileRequest');
  for (const js of [browser, native]) {
    for (const marker of ['expo-file-system', '.wasm', 'react-reconciler', 'AudioContext', 'createWorld']) expect(js).not.toContain(marker);
  }
});

test('browser app utilities exclude native, WASM and unrelated module initialization', async () => {
  for (const [name, marker] of [
    ['keepAwake', 'wakeLock'],
    ['imagePicker', 'pickFromLibrary'],
    ['review', 'requestReview']
  ] as const) {
    const js = await bundle(`export {${name}} from "@nayan-ui/engine/modules";`);
    expect(js).toContain(marker);
    for (const forbidden of ['react-native', '.wasm', 'AudioContext', 'DrawingCanvas']) expect(js).not.toContain(forbidden);
  }
});
test('native app utilities use the shared platform service without rendering dependencies', async () => {
  const js = await bundle('export {keepAwake, review, imagePicker} from "@nayan-ui/engine/modules";', true);
  expect(js).toContain('appRequest');
  for (const forbidden of ['.wasm', 'AudioContext', 'navigator.', 'DrawingCanvas']) expect(js).not.toContain(forbidden);
});
