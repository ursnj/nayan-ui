import { moduleVariations } from './module-variations';

interface ModuleExample {
  slug: string;
  title: string;
  entry: string;
  description: string;
  code: string;
  note?: string;
  guide?: string;
  filename?: string;
}

const modules = [
  {
    slug: 'animations',
    title: 'Animations',
    entry: './animations',
    description: 'Animate view styles or game entities with timing, springs and sequences.',
    code: `import { AnimationView, useAnimatedStyle, useSharedValue, withTiming } from 'nayan-ui/animations';
import { NButton } from 'nayan-ui/components';

export function FadeButton() {
  const opacity = useSharedValue(1);
  const style = useAnimatedStyle({ opacity });
  return (
    <AnimationView animatedStyle={style}>
      <NButton onPress={() => { opacity.value = withTiming(0.4); }}>Fade</NButton>
    </AnimationView>
  );
}`,
    guide: '/game-engine/animation'
  },
  {
    slug: 'assets',
    title: 'Assets',
    entry: './assets',
    description: 'Load and cache bytes from bundled assets, URLs or in-memory data.',
    code: `import { assets } from 'nayan-ui/assets';

export async function loadLogo(uri: string) {
  const { bytes, type } = await assets.load(uri);
  return { bytes, type };
}`,
    guide: '/game-engine/models-textures'
  },
  {
    slug: 'audio',
    title: 'Audio',
    entry: './audio',
    description: 'Load sounds and play them with volume, playback rate and spatial controls.',
    code: `import { audio } from 'nayan-ui/audio';

export async function playSound(uri: string) {
  const sound = await audio.loadSound(uri);
  const voice = audio.play(sound, { volume: 0.6 });
  return () => {
    audio.stop(voice);
    audio.release(sound);
  };
}`,
    note: 'On the web, start playback in response to a user gesture.',
    guide: '/game-engine/audio-haptics'
  },
  {
    slug: 'camera',
    title: 'Camera',
    entry: './camera',
    description: 'Open the camera capture flow and read a photo’s URI and dimensions.',
    code: `import { camera } from 'nayan-ui/camera';

export async function captureSize() {
  const photo = await camera.takePhoto({ maxDimension: 1024 });
  if (!photo) return null;
  try {
    return { width: photo.width, height: photo.height };
  } finally {
    await camera.release(photo.uri);
  }
}`,
    note: 'Call from a user action. Capture requires a supported camera, camera permission, and a secure context on the web.'
  },
  {
    slug: 'capture',
    title: 'Screen Capture',
    entry: './capture',
    description: 'Capture the app or screen as an image and release the temporary result after use.',
    code: `import { capture } from 'nayan-ui/capture';

export async function inspectCapture() {
  if (!(await capture.isAvailable())) return null;
  const image = await capture.screen();
  try {
    return { width: image.width, height: image.height };
  } finally {
    await capture.release(image.uri);
  }
}`,
    note: 'Start capture from a user action. Browsers with screen capture support may prompt the user to choose a source.'
  },
  {
    slug: 'clipboard',
    title: 'Clipboard',
    entry: './clipboard',
    description: 'Read and write plain text on the platform clipboard.',
    code: `import { clipboard } from 'nayan-ui/clipboard';
import { NButton } from 'nayan-ui/components';

export function CopyButton({ text }: { text: string }) {
  return <NButton onPress={() => clipboard.setString(text)}>Copy text</NButton>;
}`,
    note: 'Browsers may require a secure context and a user gesture.'
  },
  {
    slug: 'core',
    title: 'Engine Core',
    entry: './core',
    description: 'Initialize the shared Rust core before using its low-level bindings.',
    code: `import { prepareCore } from 'nayan-ui/core';

export async function initialize() {
  await prepareCore();
}`,
    guide: '/game-engine/installation'
  },
  {
    slug: 'device',
    title: 'Device',
    entry: './device',
    description: 'Inspect platform and device information to choose a suitable experience.',
    code: `import { device } from 'nayan-ui/device';

export function describeDevice() {
  return device.getEnvironment();
}`
  },
  {
    slug: 'drawing',
    title: 'Drawing',
    entry: './drawing',
    description: 'Create a drawing document, mount a canvas and manage brush strokes and layers.',
    code: `import { useEffect, useState } from 'react';
import { DrawingCanvas, DrawingDocument } from 'nayan-ui/drawing';
import { warmUpEngine } from 'nayan-ui/games';

export function Sketch() {
  const [document, setDocument] = useState<DrawingDocument>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    let drawing: DrawingDocument | undefined;
    void warmUpEngine().then(() => {
      if (!active) return;
      drawing = new DrawingDocument(320, 240);
      setDocument(drawing);
    }).catch((cause: unknown) => {
      if (active) setError(String(cause));
    });
    return () => { active = false; drawing?.dispose(); };
  }, []);
  if (error) throw new Error(error);
  return document ? <DrawingCanvas document={document} style={{ height: 240 }} /> : null;
}`,
    guide: '/game-engine/drawing'
  },
  {
    slug: 'files',
    title: 'Files',
    entry: './files',
    description: 'Read and write application files or create temporary files for sharing.',
    code: `import { files } from 'nayan-ui/files';

export async function saveNote(text: string) {
  const directory = await files.openDirectory('notes');
  await directory.writeText('note.txt', text);
  return directory.readText('note.txt');
}`
  },
  {
    slug: 'games',
    title: 'Game Runtime',
    entry: './games',
    description: 'Create a game world and render it with GameView using the focused games entry point.',
    code: `import { GameView, useWorld } from 'nayan-ui/games';

export function Scene() {
  const world = useWorld(32, (world) => {
    world.spawn({ mesh: 'cube', color: '#699cff' });
  });
  return world ? <GameView source={world} style={{ width: '100%', height: 240 }} /> : null;
}`,
    guide: '/game-engine/world-entities'
  },
  {
    slug: 'haptics',
    title: 'Haptics',
    entry: './haptics',
    description: 'Play tactile feedback where the platform supports it.',
    code: `import { haptics } from 'nayan-ui/haptics';

export function confirmSelection() {
  if (haptics.supported) haptics.notify('success');
}`,
    guide: '/game-engine/audio-haptics'
  },
  {
    slug: 'image-picker',
    title: 'Image Picker',
    entry: './image-picker',
    description: 'Let users choose an image from their library and inspect the selected asset.',
    code: `import { imagePicker } from 'nayan-ui/image-picker';

export async function selectImage() {
  const result = await imagePicker.pickFromLibrary({ maxDimension: 1024 });
  if (result.canceled) return null;
  const [image] = result.assets;
  try {
    return { name: image.fileName, width: image.width, height: image.height };
  } finally {
    await imagePicker.release(image.uri);
  }
}`
  },
  {
    slug: 'keep-awake',
    title: 'Keep Awake',
    entry: './keep-awake',
    description: 'Keep a display awake while a screen or activity needs it.',
    code: `import { useKeepAwake } from 'nayan-ui/keep-awake';
import { NText } from 'nayan-ui/components';

export function TimerScreen({ running }: { running: boolean }) {
  useKeepAwake(running);
  return <NText>{running ? 'Timer running' : 'Timer paused'}</NText>;
}`,
    note: 'The hook releases its request when the activity stops or the component unmounts.'
  },
  {
    slug: 'location',
    title: 'Location',
    entry: './location',
    description: 'Get a device location or watch for position updates.',
    code: `import { location } from 'nayan-ui/location';

export async function readPosition(signal: AbortSignal) {
  const position = await location.getCurrentPosition({ signal, timeoutMs: 10000 });
  return { latitude: position.latitude, longitude: position.longitude };
}`,
    note: 'Request location from a user action. Only use the location for the user-facing feature that requested it.'
  },
  {
    slug: 'microphone',
    title: 'Microphone',
    entry: './microphone',
    description: 'Request microphone access and record audio under user control.',
    code: `import { microphone } from 'nayan-ui/microphone';
import { warmUpEngine } from 'nayan-ui/games';

export async function startRecording() {
  await warmUpEngine();
  if (!microphone.supported || !(await microphone.requestPermission())) return false;
  return microphone.start({ maxSeconds: 10 });
}

export function finishRecording() {
  const take = microphone.take(10);
  microphone.stop();
  return take;
}`,
    note: 'Bind recording to explicit controls and release any returned sound with audio.release when done. The browser requires a secure context.'
  },
  {
    slug: 'network',
    title: 'Network',
    entry: './network',
    description: 'Observe the platform’s connectivity state and check reachability when needed.',
    code: `import { useOnline } from 'nayan-ui/network';
import { NText } from 'nayan-ui/components';

export function NetworkStatus() {
  const online = useOnline();
  return <NText>{online === null ? 'Checking…' : online ? 'Online' : 'Offline'}</NText>;
}`
  },
  {
    slug: 'permissions',
    title: 'Permissions',
    entry: './permissions',
    description: 'Check or request platform permissions and handle denied or restricted access.',
    code: `import { permissions } from 'nayan-ui/permissions';

export async function requestCameraAccess() {
  const current = await permissions.check('camera');
  if (current.status === 'granted' || current.requiresSettings) return current;
  return permissions.request('camera');
}`,
    note: 'Call request from a foreground user action. Native permission declarations belong in app configuration.'
  },
  {
    slug: 'review',
    title: 'Store Review',
    entry: './review',
    description: 'Ask a supported app store to show its native review prompt.',
    code: `import { review } from 'nayan-ui/review';

export async function askForReview() {
  if (await review.isAvailable()) await review.requestReview();
}`,
    note: 'Availability and whether the prompt appears are controlled by the platform.'
  },
  {
    slug: 'sharing',
    title: 'Sharing',
    entry: './sharing',
    description: 'Open the platform share sheet with text, a URL or a file.',
    code: `import { sharing } from 'nayan-ui/sharing';

export async function sharePage(url: string) {
  if (!(await sharing.isAvailable())) return;
  await sharing.share({ title: 'Nayan UI', url });
}`,
    note: 'Invoke the share sheet in response to a user gesture on the web.'
  },
  {
    slug: 'sqlite',
    title: 'SQLite',
    entry: './sqlite',
    description: 'Work with app-local SQL databases and parameterized queries.',
    code: `import { sqlite } from 'nayan-ui/sqlite';

export async function firstNote(title: string) {
  const db = await sqlite.open();
  try {
    await db.run('CREATE TABLE notes (title TEXT NOT NULL)');
    await db.run('INSERT INTO notes (title) VALUES (?)', [title]);
    return (await db.query('SELECT title FROM notes')).rows[0];
  } finally {
    await db.close();
  }
}`,
    note: 'Opening without a name creates an in-memory database. Supply an app-private name for persistent data.'
  },
  {
    slug: 'storage',
    title: 'Storage',
    entry: './storage',
    description: 'Persist small settings with a named store and read them reactively.',
    code: `import { createStorage, useStorage } from 'nayan-ui/storage';
import { NSwitch } from 'nayan-ui/components';

const preferences = createStorage({ id: 'preferences' });

export function SoundSetting() {
  const [enabled, setEnabled] = useStorage('sound', true, preferences);
  return <NSwitch label="Sound" value={enabled} onValueChange={setEnabled} />;
}`
  },
  {
    slug: 'tts',
    title: 'Text to Speech',
    entry: './tts',
    description: 'Speak a text string with the platform’s speech synthesizer.',
    code: `import { speech } from 'nayan-ui/tts';

export async function readAloud(text: string) {
  await speech.speak(text, { language: 'en-US' });
}`,
    note: 'Available voices depend on the platform and the installed languages.'
  },
  {
    slug: 'uuid',
    title: 'UUID',
    entry: './uuid',
    description: 'Generate stable identifiers for local records.',
    code: `import { prepareUuid, uuid } from 'nayan-ui/uuid';

export async function createRecord(name: string) {
  await prepareUuid();
  return { id: uuid(), name };
}`
  },
  {
    slug: 'video',
    title: 'Video Player',
    entry: './video',
    description: 'Play a video with the engine player and optional playback controls.',
    code: `import { VideoPlayer } from 'nayan-ui/video';

export function Clip({ uri }: { uri: string }) {
  return <VideoPlayer source={uri} controls contentFit="contain" style={{ height: 240 }} />;
}`
  },
  {
    slug: 'markdown',
    title: 'Markdown',
    entry: './markdown',
    description: 'Render Markdown on an engine surface and parse optional front matter.',
    code: `import { NMarkdown, parseFrontMatter } from 'nayan-ui/markdown';

export function Article({ source }: { source: string }) {
  const { content } = parseFrontMatter(source);
  return <NMarkdown source={content} blockSpacing={12} />;
}`
  },
  {
    slug: 'styles',
    title: 'Styles Compiler',
    entry: './styles',
    description: 'Compile theme colours and utility classes into a shared engine stylesheet.',
    code: `import { buildStyles } from 'nayan-ui/styles';

await buildStyles({
  recipeFiles: ['src/theme.ts'],
  content: ['src'],
  output: 'public/nayan-ui/styles.json',
  manifest: 'src/engine-styles.ts',
  lowerCss: false,
  publicPath: '/nayan-ui/styles.json'
});`,
    note: 'Export your utility recipes from src/theme.ts. Run this in a Bun build script and pass the generated stylesheet URL to ComponentsRoot.',
    guide: '/components/components-root'
  },
  {
    slug: 'icons',
    title: 'Icons',
    entry: './icons',
    description: 'Import individual icon components for use inside engine content.',
    code: `import { SparklesIcon } from 'nayan-ui/icons';

export function FeaturedIcon() {
  return <SparklesIcon size={20} />;
}`
  },
  {
    slug: 'icon-catalog',
    title: 'Icon Catalog',
    entry: './icons/catalog',
    description: 'Render a named icon from the full outline catalog.',
    code: `import { NIcon } from 'nayan-ui/icons/catalog';

export function DoneIcon() {
  return <NIcon name="circle-check" size={20} />;
}`
  },
  {
    slug: 'icon-outlines',
    title: 'Icon Outlines',
    entry: './icons/outline',
    description: 'Use outline data when drawing icons on a custom surface.',
    code: `import { NPathIcon } from 'nayan-ui/icons/outline';

export function DoneIcon() {
  return <NPathIcon paths="M4 12l5 5L20 6" strokeWidth={2} size={20} />;
}`
  },
  {
    slug: 'named-icons',
    title: 'Named Icons',
    entry: './icons/named',
    description: 'Import a named component from the generated icon collection.',
    code: `import { CheckIcon } from 'nayan-ui/icons/named';

export function DoneIcon() {
  return <CheckIcon size={20} />;
}`
  },
  {
    slug: 'icon-components',
    title: 'Individual Icon Components',
    entry: './icons/components/*',
    description: 'Import one icon component by its kebab-case name.',
    code: `import { SparklesIcon } from 'nayan-ui/icons/components/sparkles';

export function FeaturedIcon() {
  return <SparklesIcon size={20} />;
}`
  },
  {
    slug: 'icon-paths',
    title: 'Individual Icon Paths',
    entry: './icons/*',
    description: 'Import the paths, view box and stroke width of one icon.',
    code: `import check from 'nayan-ui/icons/check';

export function CheckIcon() {
  return (
    <svg viewBox={'0 0 ' + check.viewBox + ' ' + check.viewBox} fill="none"
      stroke="currentColor" strokeWidth={check.strokeWidth} aria-hidden="true">
      {check.paths.map((path) => <path key={path} d={path} />)}
    </svg>
  );
}`
  },
  {
    slug: 'web',
    title: 'Web Entry Point',
    entry: './web',
    description: 'Use the browser compatibility entry for an explicitly web-only consumer.',
    code: `import { warmUpEngine } from 'nayan-ui/web';

export async function preload() {
  await warmUpEngine();
}`,
    guide: '/game-engine/react'
  },
  {
    slug: 'wasm-runtime',
    title: 'WebAssembly Runtime',
    entry: './wasm-runtime',
    description: 'Resolve the low-level WebAssembly runtime module in a browser build.',
    code: `export async function loadRuntime() {
  return import('nayan-ui/wasm-runtime');
}`,
    note: 'For application code, prepareCore initializes the runtime and handles browser asset loading.',
    guide: '/modules/core'
  },
  {
    slug: 'expo-plugin',
    title: 'Expo Plugin',
    entry: './app.plugin.js',
    description: 'Configure native engine capabilities in an Expo app before building a development client.',
    code: `export default {
  expo: {
    name: 'My app',
    slug: 'my-app',
    plugins: ['nayan-ui']
  }
};`,
    filename: 'app.config.js',
    guide: '/game-engine/react-native'
  },
  {
    slug: 'package-metadata',
    title: 'Package Metadata',
    entry: './package.json',
    description: 'Read the published engine manifest from a Bun script.',
    code: `import metadata from 'nayan-ui/package.json';

console.log(metadata.name, metadata.version);`,
    filename: 'version.ts'
  }
] as const satisfies readonly ModuleExample[];

export type ModuleSlug = (typeof modules)[number]['slug'];

export const moduleReferences = modules.map((module: ModuleExample & { slug: ModuleSlug }) => ({
  ...module,
  variations: moduleVariations[module.slug],
  path: `/modules/${module.slug}`,
  importPath: `nayan-ui/${module.entry.slice(2)}`
}));
