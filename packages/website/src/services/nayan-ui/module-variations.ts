import type { ModuleSlug } from './module-reference';

interface ModuleVariation {
  title: string;
  code: string;
  note?: string;
  filename?: string;
}

export const moduleVariations: Record<ModuleSlug, readonly [ModuleVariation, ...ModuleVariation[]]> = {
  animations: [
    {
      title: 'Spring an interactive view',
      code: `import { AnimationView, useAnimatedStyle, useSharedValue, withSpring } from 'nayan-ui/animations';
import { NButton } from 'nayan-ui/components';

export function SlideButton() {
  const offset = useSharedValue(0);
  const style = useAnimatedStyle({ translateX: offset });
  return (
    <AnimationView animatedStyle={style}>
      <NButton onPress={() => { offset.value = withSpring(offset.value === 0 ? 24 : 0); }}>Slide</NButton>
    </AnimationView>
  );
}`
    },
    {
      title: 'Play a preset on a view',
      code: `import { useRef } from 'react';
import { AnimationView, animations, type AnimationViewRef } from 'nayan-ui/animations';
import { NButton, NText } from 'nayan-ui/components';

export function Attention() {
  const target = useRef<AnimationViewRef>(null);
  return (
    <>
      <AnimationView ref={target}><NText>New item</NText></AnimationView>
      <NButton onPress={() => { if (target.current) animations.playView(target.current, 'pulse'); }}>Highlight</NButton>
    </>
  );
}`
    },
    {
      title: 'Animate an entity or play a model clip',
      code: `import { animations } from 'nayan-ui/animations';
import type { Entity, World } from 'nayan-ui/games';

export function move(world: World, entity: Entity) {
  return animations.animate(world, entity, { position: [0, 2, 0] });
}

export function loopClip(world: World, entity: Entity, clip: string) {
  animations.playClip(world, entity, clip, { loop: true });
  return () => { animations.stopClip(world, entity); };
}`
    }
  ],
  assets: [
    {
      title: 'Prefetch URLs and bundled assets',
      code: `import { assets, type AssetSource } from 'nayan-ui/assets';

export async function prepareImages(cover: AssetSource, icon: AssetSource) {
  await assets.prefetch([cover, icon]);
  return [assets.resolve(cover), assets.resolve(icon)];
}`,
      note: 'Pass a URL on either platform, or a Metro require result in a React Native app.'
    },
    {
      title: 'Refresh one cached resource',
      code: `import { assets } from 'nayan-ui/assets';

export async function refreshBytes(uri: string) {
  await assets.evict(uri);
  return assets.read(uri, { reload: true });
}`
    }
  ],
  audio: [
    {
      title: 'Loop, seek, and mix a sound',
      code: `import { audio } from 'nayan-ui/audio';

export async function openLoop(uri: string) {
  const sound = await audio.loadSound(uri);
  const voice = audio.play(sound, { loop: true, volume: 0.4 });
  return {
    pause: () => voice !== null && audio.pause(voice),
    resume: () => voice !== null && audio.resume(voice),
    seek: (seconds: number) => voice !== null && audio.seek(voice, seconds),
    mix: (volume: number, pan: number) => voice !== null && audio.setVoiceMix(voice, volume, pan),
    dispose() { audio.stop(voice); audio.release(sound); }
  };
}`
    },
    {
      title: 'Use a named sound bank',
      code: `import { SoundBank } from 'nayan-ui/audio';

export const effects = new SoundBank({
  click: '/sounds/click.wav',
  complete: '/sounds/complete.wav'
});

export async function previewEffects() {
  await effects.ready;
  return effects.play('complete', { volume: 0.5, pitch: 1.1 });
}`
    },
    {
      title: 'Decode WAV bytes and inspect audio levels',
      code: `import { audio } from 'nayan-ui/audio';

export async function inspectWav(bytes: ArrayBuffer) {
  const sound = await audio.decodeWav(bytes);
  try {
    return { duration: audio.duration(sound), levels: audio.levels(sound, 20) };
  } finally {
    audio.release(sound);
  }
}`
    }
  ],
  camera: [
    {
      title: 'Request camera access before capture',
      code: `import { camera } from 'nayan-ui/camera';

export async function captureSquare() {
  if (!(await camera.isAvailable())) return null;
  const current = await camera.getPermission();
  if (current.requiresSettings) return null;
  const access = current.status === 'granted' ? current : await camera.requestPermission();
  if (access.status !== 'granted') return null;
  const photo = await camera.takePhoto({
    allowsEditing: true, aspect: [1, 1], format: 'jpeg', quality: 0.85, maxDimension: 1024
  });
  if (!photo) return null;
  return { photo, dispose: () => camera.release(photo.uri) };
}`,
      note: 'Start from a user action. Release the returned URI after saving or displaying the photo.'
    }
  ],
  capture: [
    {
      title: 'Share a temporary screenshot',
      code: `import { capture } from 'nayan-ui/capture';
import { sharing } from 'nayan-ui/sharing';

export async function shareScreenshot() {
  if (!(await capture.isAvailable()) || !(await sharing.isAvailable())) return;
  const image = await capture.screen();
  try {
    await sharing.share({ uri: image.uri, title: 'Screenshot', mimeType: 'image/png', fileName: 'screenshot.png' });
  } finally {
    await capture.release(image.uri);
  }
}`,
      note: 'Use from a user action where the platform supports sharing a captured URI.'
    }
  ],
  clipboard: [
    {
      title: 'Paste plain text',
      code: `import { clipboard } from 'nayan-ui/clipboard';

export async function pasteText() {
  if (!clipboard.isAvailable() || !(await clipboard.hasString())) return '';
  return clipboard.getString();
}`,
      note: 'Call from a paste action so the browser can ask for permission when needed.'
    },
    {
      title: 'Copy rich text with a plain-text alternative',
      code: `import { clipboard } from 'nayan-ui/clipboard';

export async function copyLink() {
  await clipboard.setHTML('<a href="https://www.nayanui.com/">Nayan UI</a>', 'https://www.nayanui.com/');
}

export async function readRichText() {
  return clipboard.getHTML();
}`
    }
  ],
  core: [
    {
      title: 'Prepare the core before creating a drawing',
      code: `import { prepareCore } from 'nayan-ui/core';
import { DrawingDocument } from 'nayan-ui/drawing';

export async function openSketch(width: number, height: number) {
  await prepareCore();
  const document = new DrawingDocument(width, height);
  return { document, dispose: () => document.dispose() };
}`
    }
  ],
  device: [
    {
      title: 'Distinguish hardware, virtual devices, and browsers',
      code: `import { device } from 'nayan-ui/device';

export function canVerifyNativeSensor() {
  const environment = device.getEnvironment();
  if (environment === 'browser') return 'browser';
  if (device.isVirtualDevice()) return 'virtual-device';
  return device.isPhysicalDevice() ? 'hardware' : 'unknown';
}`,
      note: 'Use the individual feature’s availability check before calling a hardware API.'
    }
  ],
  drawing: [
    {
      title: 'Add a layer and configure a tool',
      code: `import type { DrawingDocument } from 'nayan-ui/drawing';

export function configureSketch(document: DrawingDocument) {
  document.layer('add', { name: 'Outline' });
  document.setBrush({ brushType: 'PENCIL', color: '#475569', width: 3, opacity: 0.9, pressure: true });
}

export function configureShape(document: DrawingDocument) {
  document.setBrush({
    brushType: 'NORMAL', color: '#0ea5e9', width: 3, opacity: 1, tool: 'circle', filled: true
  });
}`
    },
    {
      title: 'Save, restore, and export a drawing',
      code: `import type { DrawingDocument } from 'nayan-ui/drawing';

export function saveSketch(document: DrawingDocument) {
  return { project: document.exportProject(), svg: document.exportSVG() };
}

export function restoreSketch(document: DrawingDocument, project: string) {
  return document.load(project);
}`
    }
  ],
  files: [
    {
      title: 'Inspect and clean up cached binary files',
      code: `import { files } from 'nayan-ui/files';

export async function updateCache(bytes: Uint8Array) {
  const directory = await files.openDirectory('previews');
  await directory.write('latest.bin', bytes);
  const entries = await directory.list();
  const latest = await directory.stat('latest.bin');
  await directory.remove('obsolete.bin');
  return { entries, latest, bytes: await directory.read('latest.bin') };
}`
    },
    {
      title: 'Create a temporary file and release it',
      code: `import { files } from 'nayan-ui/files';

export async function withTemporaryPng<T>(base64: string, useFile: (uri: string) => Promise<T>) {
  const uri = await files.writeTemporary(base64, { fileName: 'preview.png', mimeType: 'image/png' });
  try {
    return await useFile(uri);
  } finally {
    await files.removeTemporary(uri);
  }
}`
    }
  ],
  games: [
    {
      title: 'Apply an impulse to a physics body',
      code: `import { useRef } from 'react';
import { GameView, useWorld, type Entity } from 'nayan-ui/games';

export function PhysicsScene() {
  const body = useRef<Entity | null>(null);
  const world = useWorld(32, (scene) => {
    body.current = scene.spawn({ mesh: 'sphere', physics: 'dynamic', position: [0, 1, 0] });
    scene.spawn({ mesh: 'cube', physics: 'fixed', scale: [8, 0.25, 8] });
  });
  return world && (
    <GameView source={world} style={{ height: 250 }} onTap={() => {
      if (body.current !== null) world.impulse(body.current, [0, 4, 0]);
    }} />
  );
}`
    },
    {
      title: 'Track a score and countdown',
      code: `import type { World } from 'nayan-ui/games';

export function startRound(world: World) {
  world.scoreboard.reset(3);
  world.scoreboard.startCountdown(60);
  return () => world.scoreboard.add(10);
}`
    },
    {
      title: 'Load a texture and spawn a textured entity',
      code: `import { loadTexture, type World } from 'nayan-ui/games';

export async function addCrate(world: World, uri: string) {
  const texture = await loadTexture(uri);
  return world.spawn({ mesh: 'cube', texture, position: [0, 1, 0] });
}`
    }
  ],
  haptics: [
    {
      title: 'Distinguish selection, impact, and completion',
      code: `import { haptics } from 'nayan-ui/haptics';

export function feedback(event: 'selection' | 'impact' | 'complete') {
  if (!haptics.supported || !haptics.enabled) return;
  if (event === 'selection') haptics.selection();
  else if (event === 'impact') haptics.impact(0.5, 0.65);
  else haptics.notify('success');
}`
    },
    {
      title: 'Play a custom two-tap pattern',
      code: `import { haptics } from 'nayan-ui/haptics';

export function doubleTap() {
  if (!haptics.supported) return;
  haptics.play([
    { time: 0, intensity: 0.35, sharpness: 0.4 },
    { time: 0.12, intensity: 0.65, sharpness: 0.7 }
  ]);
}`
    }
  ],
  'image-picker': [
    {
      title: 'Select multiple photos with bounded size',
      code: `import { imagePicker } from 'nayan-ui/image-picker';

export async function pickGallery() {
  const result = await imagePicker.pickFromLibrary({ multiple: true, selectionLimit: 4, maxDimension: 1280 });
  if (result.canceled) return null;
  const { assets } = result;
  return { assets, dispose: () => Promise.all(assets.map(({ uri }) => imagePicker.release(uri))) };
}`
    },
    {
      title: 'Capture and crop a profile image',
      code: `import { imagePicker } from 'nayan-ui/image-picker';

export async function takeProfilePhoto() {
  const permission = await imagePicker.requestCameraPermission();
  if (permission.status !== 'granted') return null;
  const result = await imagePicker.launchCamera({ allowsEditing: true, aspect: [1, 1], maxDimension: 512 });
  return result.canceled ? null : result.assets[0] ?? null;
}`,
      note: 'Call from a user action and release the selected URI after copying or displaying it.'
    }
  ],
  'keep-awake': [
    {
      title: 'Keep the screen awake during an async task',
      code: `import { keepAwake } from 'nayan-ui/keep-awake';

export async function runWithScreenAwake<T>(run: () => Promise<T>) {
  if (!keepAwake.isAvailable()) return run();
  const tag = 'foreground-export';
  await keepAwake.activate(tag);
  try {
    return await run();
  } finally {
    await keepAwake.deactivate(tag);
  }
}`
    }
  ],
  location: [
    {
      title: 'Watch approximate location while a view is active',
      code: `import { location, type LocationPosition } from 'nayan-ui/location';

export async function watchMap(onPosition: (position: LocationPosition) => void) {
  if (!(await location.isAvailable())) return null;
  const access = await location.requestPermission('approximate');
  if (access.status !== 'granted') return null;
  return location.watchPosition(onPosition, { highAccuracy: false, onError: console.error });
}`,
      note: 'Start from a foreground action. Call the returned unsubscribe when the view closes.'
    },
    {
      title: 'Handle an abort or timeout on a one-time request',
      code: `import { location, LocationError } from 'nayan-ui/location';

export async function tryLocation(signal: AbortSignal) {
  try {
    return await location.getCurrentPosition({ highAccuracy: true, timeoutMs: 8000, signal });
  } catch (error) {
    if (error instanceof LocationError && (error.code === 'aborted' || error.code === 'timeout')) return null;
    throw error;
  }
}`
    }
  ],
  microphone: [
    {
      title: 'Play back a recorded take and release its audio',
      code: `import { microphone } from 'nayan-ui/microphone';
import { audio } from 'nayan-ui/audio';

export function previewTake(seconds = 5) {
  const take = microphone.take(seconds, { levelsPerSecond: 20, skipEnd: 0.1 });
  microphone.stop();
  if (!take) return null;
  const voice = audio.play(take.sound);
  return {
    duration: take.duration,
    waveform: take.levels,
    dispose() { audio.stop(voice); audio.release(take.sound); }
  };
}`,
      note: 'Call after starting an authorized recording. Call dispose after playback or when leaving the screen.'
    }
  ],
  network: [
    {
      title: 'Subscribe outside React',
      code: `import { network, type NetworkListener } from 'nayan-ui/network';

export async function startConnectivityListener(onChange: NetworkListener) {
  onChange(await network.fetch());
  return network.subscribe(onChange);
}`,
      note: 'Call the returned function to stop receiving changes.'
    },
    {
      title: 'Wait for connectivity and check your service',
      code: `import { network, checkReachability } from 'nayan-ui/network';

export async function serviceReady(healthUrl: string, signal: AbortSignal) {
  if (!(await network.waitForOnline({ timeoutMs: 3000, signal }))) return false;
  return checkReachability({ url: healthUrl, method: 'HEAD', timeout: 3000, expectedStatus: 204, signal });
}`
    }
  ],
  permissions: [
    {
      title: 'Check several permissions before prompting',
      code: `import { permissions } from 'nayan-ui/permissions';

const required = ['camera', 'microphone'] as const;
export function checkAccess() {
  return permissions.checkMany(required);
}

export function requestAccess() {
  return permissions.requestMany(required);
}`,
      note: 'Bind requestAccess to an explicit foreground action. Check results before using either feature.'
    },
    {
      title: 'Offer Settings after an access denial',
      code: `import { permissions } from 'nayan-ui/permissions';

export async function openCameraSettingsIfNeeded() {
  const permission = await permissions.check('camera');
  if (permission.requiresSettings) await permissions.openSettings('camera');
}`
    }
  ],
  review: [
    {
      title: 'Offer a store link when the native prompt is unavailable',
      code: `import { review } from 'nayan-ui/review';

export async function reviewAction(openStorePage: () => void) {
  if (await review.isAvailable()) {
    await review.requestReview();
  } else {
    openStorePage();
  }
}`,
      note: 'Invoke this from an explicit review action. A supported platform may still decline to show its prompt.'
    }
  ],
  sharing: [
    {
      title: 'Share a browser File',
      code: `import { sharing } from 'nayan-ui/sharing';

export async function shareNotes(file: File) {
  if (!(await sharing.isAvailable())) return;
  await sharing.share({ file, title: 'Notes', text: 'Here are my notes.' });
}`
    },
    {
      title: 'Share a native file URI',
      code: `import { sharing } from 'nayan-ui/sharing';

export async function shareReport(uri: string) {
  if (!(await sharing.isAvailable())) return;
  await sharing.share({ uri, mimeType: 'application/pdf', fileName: 'report.pdf' });
}`
    }
  ],
  sqlite: [
    {
      title: 'Open a persistent database and write a transaction',
      code: `import { sqlite } from 'nayan-ui/sqlite';

export function saveNotes(notes: readonly string[]) {
  return sqlite.withDatabase('notes', async (database) => {
    await database.run('CREATE TABLE IF NOT EXISTS notes (title TEXT NOT NULL)');
    return database.batch(notes.map((title) => ({ sql: 'INSERT INTO notes (title) VALUES (?)', params: [title] })));
  });
}`
    },
    {
      title: 'Read a single row by parameter',
      code: `import { sqlite } from 'nayan-ui/sqlite';

export function findNote(title: string) {
  return sqlite.withDatabase('notes', async (database) => {
    const row = await database.get('SELECT title FROM notes WHERE title = ? LIMIT 1', [title]);
    return row?.[0];
  });
}`,
      note: 'Create the notes table first, as in the persistent database example.'
    }
  ],
  storage: [
    {
      title: 'Store JSON and subscribe to changes',
      code: `import { createStorage } from 'nayan-ui/storage';

const preferences = createStorage({ id: 'preferences' });
export function subscribeToSettings(onChange: (key: string) => void) {
  return preferences.subscribe(onChange);
}

export function setLayout(columns: number) {
  preferences.setJSON('layout', { columns });
  preferences.flush();
  return preferences.getJSON<{ columns: number }>('layout');
}`
    },
    {
      title: 'Persist and restore an application cache',
      code: `import { createStoragePersister } from 'nayan-ui/storage';

const persister = createStoragePersister<{ updatedAt: number; keys: string[] }>({ key: 'query-cache' });
export async function saveCache(keys: string[]) {
  await persister.persistClient({ updatedAt: Date.now(), keys });
  await persister.flush();
}

export const restoreCache = () => persister.restoreClient();
export const clearCache = () => persister.removeClient();`
    },
    {
      title: 'Bind a JSON setting to a component',
      code: `import { createStorage, useStorageJSON } from 'nayan-ui/storage';
import { NButton } from 'nayan-ui/components';

const settings = createStorage({ id: 'layout' });
export function Columns() {
  const [layout, setLayout] = useStorageJSON('cards', { columns: 2 }, settings);
  return <NButton onPress={() => setLayout(({ columns }) => ({ columns: columns + 1 }))}>{layout.columns} columns</NButton>;
}`
    }
  ],
  tts: [
    {
      title: 'Pick a voice by language',
      code: `import { speech } from 'nayan-ui/tts';

export async function speakWithVoice(text: string, language: string) {
  const voices = await speech.getAvailableVoicesAsync();
  const voice = voices.find((item) => item.language === language)?.identifier;
  await speech.speak(text, { language, voice, rate: 0.9, pitch: 1, volume: 0.8 });
}`
    },
    {
      title: 'Pause, resume, or stop speech',
      code: `import { speech } from 'nayan-ui/tts';

export async function controlSpeech(action: 'pause' | 'resume' | 'stop') {
  if (action === 'pause' && await speech.isSpeakingAsync()) await speech.pause();
  if (action === 'resume') await speech.resume();
  if (action === 'stop') await speech.stop();
}`
    }
  ],
  uuid: [
    {
      title: 'Initialize once and assign a batch of stable IDs',
      code: `import { prepareUuid, uuid } from 'nayan-ui/uuid';

export async function importNames(names: readonly string[]) {
  await prepareUuid();
  return names.map((name) => ({ id: uuid(), name }));
}`
    }
  ],
  video: [
    {
      title: 'Preview a muted looping clip',
      code: `import { VideoPlayer } from 'nayan-ui/video';

export function LoopPreview({ uri }: { uri: string }) {
  return <VideoPlayer source={{ uri, mimeType: 'video/mp4' }} autoPlay loop muted contentFit="cover" style={{ height: 180 }} />;
}`
    },
    {
      title: 'Control playback from your own buttons',
      code: `import { useRef } from 'react';
import { NButton } from 'nayan-ui/components';
import { VideoPlayer, type VideoPlayerHandle } from 'nayan-ui/video';

export function ControlledClip({ uri }: { uri: string }) {
  const player = useRef<VideoPlayerHandle>(null);
  return (
    <>
      <VideoPlayer ref={player} source={uri} controls={false} style={{ height: 240 }} />
      <NButton onPress={() => player.current?.play()}>Play</NButton>
      <NButton onPress={() => player.current?.pause()}>Pause</NButton>
      <NButton onPress={() => player.current?.seek(0)}>Restart</NButton>
    </>
  );
}`
    }
  ],
  markdown: [
    {
      title: 'Style rendered headings, links, and code',
      code: `import { NMarkdown } from 'nayan-ui/markdown';

export function StyledNotes({ source }: { source: string }) {
  return (
    <NMarkdown
      source={source}
      blockSpacing={10}
      classNames={{ h1: 'text-2xl font-bold', a: 'text-accent', code: 'font-mono' }}
      styles={{ p: { lineHeight: 24 } }}
    />
  );
}`
    },
    {
      title: 'Read front matter without rendering a document',
      code: `import { parseFrontMatter } from 'nayan-ui/markdown';

export function summarize(source: string) {
  const parsed = parseFrontMatter(source);
  return { metadata: parsed.data, preview: parsed.content.trim().slice(0, 160) };
}`
    }
  ],
  styles: [
    {
      title: 'Check supported utility classes',
      code: `import { compileUtilities } from 'nayan-ui/styles';

export function inspectClasses(classes: readonly string[]) {
  const { css, supported, unsupported } = compileUtilities(classes);
  return { css, supported, unsupported };
}`
    },
    {
      title: 'Watch styles alongside the development server',
      filename: 'styles-dev.ts',
      code: `import { developStyles } from 'nayan-ui/styles';

await developStyles({
  recipeFiles: ['src/theme.ts'],
  content: ['src'],
  output: 'public/nayan-ui/styles.json',
  lowerCss: false,
  publicPath: '/nayan-ui/styles.json',
  manifest: 'src/engine-styles.ts'
}, ['bun', 'run', 'next', 'dev']);`
    }
  ],
  icons: [
    {
      title: 'Pair an accessible label with an icon',
      code: `import { CheckIcon, XIcon } from 'nayan-ui/icons';
import { NText } from 'nayan-ui/components';

export function Status({ complete }: { complete: boolean }) {
  const Icon = complete ? CheckIcon : XIcon;
  return <NText><Icon size={16} /> {complete ? 'Complete' : 'Incomplete'}</NText>;
}`
    }
  ],
  'icon-catalog': [
    {
      title: 'Choose a catalog icon by state',
      code: `import { NIcon } from 'nayan-ui/icons/catalog';

export function StatusIcon({ complete }: { complete: boolean }) {
  return <NIcon name={complete ? 'circle-check' : 'clock'} size={20} accessibilityLabel={complete ? 'Complete' : 'Pending'} />;
}`
    }
  ],
  'icon-outlines': [
    {
      title: 'Render a filled outline with a custom view box',
      code: `import { NPathIcon } from 'nayan-ui/icons/outline';

export function Diamond() {
  return <NPathIcon paths="M6 0 12 6 6 12 0 6Z" viewBox={[0, 0, 12, 12]} size={18} color="#3b82f6" />;
}`
    }
  ],
  'named-icons': [
    {
      title: 'Use different sizes and colors',
      code: `import { CheckIcon, XIcon } from 'nayan-ui/icons/named';

export function Verdict({ ok }: { ok: boolean }) {
  return ok ? <CheckIcon size={20} color="#15803d" /> : <XIcon size={16} color="#b91c1c" />;
}`
    }
  ],
  'icon-components': [
    {
      title: 'Import individual status icons',
      code: `import { CheckIcon } from 'nayan-ui/icons/components/check';
import { ClockIcon } from 'nayan-ui/icons/components/clock';

export function SmallStatusIcon({ pending }: { pending: boolean }) {
  const Icon = pending ? ClockIcon : CheckIcon;
  return <Icon size={16} color={pending ? '#92400e' : '#15803d'} />;
}`
    }
  ],
  'icon-paths': [
    {
      title: 'Pass an imported outline to the engine renderer',
      code: `import check from 'nayan-ui/icons/check';
import { NPathIcon } from 'nayan-ui/icons/outline';

export function InlineCheck() {
  return <NPathIcon paths={check.paths} viewBox={check.viewBox} strokeWidth={check.strokeWidth} size={16} />;
}`
    }
  ],
  web: [
    {
      title: 'Render a game in a browser-only client component',
      code: `'use client';

import { GameView, useWorld } from 'nayan-ui/web';

export function BrowserScene() {
  const world = useWorld(16, (scene) => { scene.spawn({ mesh: 'cube', color: '#3b82f6' }); });
  return world ? <GameView source={world} style={{ height: 220, width: '100%' }} /> : null;
}`
    }
  ],
  'wasm-runtime': [
    {
      title: 'Load the runtime only in a browser',
      code: `export async function browserRuntime() {
  if (typeof window === 'undefined') return undefined;
  return import('nayan-ui/wasm-runtime');
}`,
      note: 'For normal application startup use prepareCore from nayan-ui/core, which also locates and initializes engine assets.'
    }
  ],
  'expo-plugin': [
    {
      title: 'Configure native camera and microphone usage',
      filename: 'app.config.js',
      code: `export default {
  expo: {
    name: 'Capture notes',
    slug: 'capture-notes',
    plugins: ['nayan-ui'],
    ios: {
      infoPlist: {
        NSCameraUsageDescription: 'Take photos for your notes.',
        NSMicrophoneUsageDescription: 'Record audio for your notes.'
      }
    },
    android: { permissions: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO'] }
  }
};`,
      note: 'Build a new development client after changing native declarations.'
    }
  ],
  'package-metadata': [
    {
      title: 'Read the manifest version and available entry points',
      code: `import metadata from 'nayan-ui/package.json';

export const version = metadata.version;
export const entryPoints = Object.keys(metadata.exports).filter((name) => name.startsWith('./'));`
    }
  ]
};
