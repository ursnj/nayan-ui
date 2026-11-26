import { moduleVariations } from './module-variations';
import { ALL_PLATFORMS, NATIVE_PLATFORMS, WEB_PLATFORMS, type ReferencePlatform } from './reference-platforms';

interface ModuleExample {
  slug: string;
  title: string;
  entry: string;
  description: string;
  platforms?: readonly ReferencePlatform[];
  code: string;
  note?: string;
  details?: readonly string[];
  related?: readonly { label: string; href: string }[];
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
    description: 'Play common audio formats, monitor progress, and control volume, looping and speed with the Rust mixer.',
    code: `import { audio } from 'nayan-ui/audio';

export async function loadPlayback(uri: string) {
  const sound = await audio.loadSound(uri);
  // Invoke this returned function from a play button.
  return () => audio.play(sound, { volume: 0.6 });
}`,
    note: 'Start playback in response to a user gesture on the web. loadSound caches the decoded audio for reuse.',
    details: [
      'Load mono or stereo WAV, MP3, AAC-LC in M4A, FLAC or Ogg Vorbis. Clips decode into memory. Use audio.decode() for encoded bytes that your app owns.',
      'Use getStatus() for the playback state, position and duration. You can pause, resume, seek, stop, mute, change speed or toggle looping on an existing voice.',
      'Use encodeWav() to export a loaded sound or microphone take as 16-bit PCM WAV. Release sounds created by decode(), decodeWav(), shift() or the microphone when done.'
    ],
    guide: '/game-engine/audio-haptics',
    related: [{ label: 'Record and export a voice note', href: '/modules/microphone' }]
  },
  {
    slug: 'camera',
    title: 'Camera',
    entry: './camera',
    description: 'Capture a photo and optionally crop, rotate, flip, or apply a filter before saving.',
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
    note: 'Call from a user action. Expo apps enable the image picker in the nayan-ui plugin and rebuild. Web camera capture requires a supported secure context.',
    details: [
      'Use getPermission() and requestPermission() to check and request camera access. The camera opens a system capture view on mobile and a live preview in browsers.',
      'Set allowEditing: true to open the photo editor after capture. Crop defaults to square. Use aspect to choose another ratio. The existing allowsEditing option takes precedence when both spellings are provided.',
      'Canceling either capture or editing returns null. Release the temporary URI after use. The browser stops its media stream when the camera preview closes.'
    ],
    related: [
      { label: 'Image picker and filters', href: '/modules/image-picker' },
      { label: 'Expo configuration', href: '/modules/expo-plugin' }
    ]
  },
  {
    slug: 'document-picker',
    title: 'Document picker',
    entry: './document-picker',
    description: 'Choose documents from the system picker with MIME filters and optional multiple selection.',
    code: `import { documentPicker } from 'nayan-ui/document-picker';

export async function getPdfName() {
  const result = await documentPicker.getDocumentAsync({ type: 'application/pdf' });
  if (result.canceled) return null;
  const [pdf] = result.assets;
  if (!pdf) return null;
  try {
    return pdf.name;
  } finally {
    await documentPicker.release(pdf.uri);
  }
}`,
    note: 'Call from a user action on the web. Include document-picker in custom native feature profiles and rebuild the app.',
    details: [
      'Filter by MIME type and use multiple: true to select several files. Each asset includes a URI, name and last-modified timestamp, plus size and MIME type when available. Cancellation returns { canceled: true, assets: null }.',
      'Native builds copy into app cache by default. With copyToCacheDirectory: false, Android returns the provider content URI and iOS returns the system-imported file URL. Release app-owned cache copies when finished.',
      'Browser results include File objects and a FileList. Use base64: true when you need a data URL and release the owned blob URIs after use.'
    ],
    related: [
      { label: 'Save documents in app-private files', href: '/modules/files' },
      { label: 'Read bytes from a URI', href: '/modules/assets' }
    ]
  },
  {
    slug: 'contacts',
    title: 'Contacts',
    entry: './contacts',
    description: 'Search and manage device contacts on Android and iOS, or an app-owned address book on the web.',
    code: `import { contacts } from 'nayan-ui/contacts';

export async function searchContacts(search: string, offset = 0) {
  const { read } = await contacts.requestPermissions();
  if (read.status !== 'granted' && read.status !== 'limited') return null;
  return contacts.list({ search, offset, limit: 25 });
}`,
    note: 'For Expo, set contactsPermission on the nayan-ui plugin and rebuild. Browsers persist their app-owned contacts in IndexedDB.',
    details: [
      'Call getPermissions() to check access or requestPermissions({ write: true }) from a user action before editing device contacts. iOS can grant limited access to selected contacts.',
      'Search by name, company, job title, phone or email. Pass offset and limit to list() and use hasNextPage to fetch more results.',
      'Manage a contact by its opaque ID with get(), update() and remove(). Android linked or read-only contacts can be managed in the system Contacts app.'
    ],
    related: [{ label: 'Expo contacts permissions', href: '/modules/expo-plugin' }],
    guide: 'https://github.com/ursnj/nayan-ui/blob/main/packages/nayan-ui/README.md#contacts'
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
    description: 'Save app-private text and binary files, inspect metadata, and create temporary file URIs for sharing.',
    code: `import { files } from 'nayan-ui/files';

export async function saveNote(text: string) {
  const directory = await files.openDirectory('notes');
  await directory.writeText('note.txt', text);
  return directory.readText('note.txt');
}`,
    details: [
      'openDirectory() creates a persistent, flat namespace. Use write() and read() for bytes, writeText() and readText() for UTF-8, and stat(), list() and remove() to manage its files. Missing reads or metadata return undefined.',
      'Private files are limited to 64 MiB each. Browsers use IndexedDB and follow its storage quota. Persistent files are addressed by namespace and filename.',
      'For a shareable URI, writeTemporary() accepts padded Base64 up to 64 MiB and returns a native file URI or an owned browser Blob URL. Remove it after the consumer finishes.',
      'The API is focused on app-owned files. Nested paths, copy and move, seekable handles, file streams and transfer tasks are outside its current scope.'
    ],
    related: [
      { label: 'Pick documents', href: '/modules/document-picker' },
      { label: 'Share a temporary URI', href: '/modules/sharing' }
    ]
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
    description: 'Pick photos and edit a single image with cropping, rotation, flipping, filters, and brightness.',
    code: `import { imagePicker } from 'nayan-ui/image-picker';

export async function selectImage() {
  const result = await imagePicker.pickFromLibrary({ allowsEditing: true, aspect: [1, 1], maxDimension: 1024 });
  if (result.canceled) return null;
  const [image] = result.assets;
  try {
    return { name: image.fileName, width: image.width, height: image.height };
  } finally {
    await imagePicker.release(image.uri);
  }
}`,
    details: [
      'Use allowsEditing to open the editor for a single image. It supports crop, rotate, horizontal flip, brightness, and Original, Black and white, Sepia and Vivid presets.',
      'Pick several images with multiple and selectionLimit. For output, choose JPEG or PNG and set maxDimension to bound the image size.',
      'Treat returned assets as temporary and call release() once you have uploaded, copied or finished displaying them. On web, camera capture through the picker is a device hint. Use the Camera module for a live preview.'
    ],
    related: [
      { label: 'Live camera capture', href: '/modules/camera' },
      { label: 'Expo configuration', href: '/modules/expo-plugin' }
    ]
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
    description: 'Request microphone access, pause or resume capture, meter input and export a recording as WAV.',
    code: `import { microphone } from 'nayan-ui/microphone';

export async function startRecording() {
  await microphone.prepare();
  if (!microphone.supported || !(await microphone.requestPermission())) return false;
  return microphone.start({ maxSeconds: 10 });
}

export function finishRecording() {
  return microphone.finish();
}`,
    note: 'Bind recording to explicit controls. The browser requires a secure context. Expo apps can set microphonePermission in the nayan-ui plugin and rebuild.',
    details: [
      'State reports off, starting, listening, paused or failed. Read level for normalized input loudness and held for buffered seconds.',
      'Pause keeps the microphone and buffered audio. Resume continues the same recording. Finish stops and returns the take. Stop discards it.',
      'The microphone keeps a rolling window of 0.5–30 seconds. Release the returned mixer sound after playing or exporting it.'
    ],
    related: [
      { label: 'Audio playback and WAV export', href: '/modules/audio' },
      { label: 'Expo microphone permissions', href: '/modules/expo-plugin' }
    ]
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
    platforms: NATIVE_PLATFORMS,
    code: `import { review } from 'nayan-ui/review';

export async function askForReview() {
  if (await review.isAvailable()) await review.requestReview();
}`,
    note: 'Availability and whether the prompt appears are controlled by the platform.'
  },
  {
    slug: 'auth',
    title: 'Auth',
    entry: './auth',
    description: 'Start Google or Apple sign-in in the system browser and validate OAuth callback data using the Rust core.',
    code: `import { auth, type SignInOptions, type SignInProvider, type SignInRequest } from 'nayan-ui/auth';

export async function startSignIn(
  provider: SignInProvider,
  options: SignInOptions,
  registerPending: (request: SignInRequest) => Promise<void>,
  openBrowser: (url: string) => void | Promise<void>
) {
  const request = await auth.createRequest(provider, options);
  await registerPending(request);
  await openBrowser(request.authorizationUrl);
}`,
    note: 'Use a Google Web application client ID or Apple Services ID and an HTTPS return URL registered with the provider. The backend binds the pending request to the initiating session, verifies the callback, exchanges the code, and verifies the ID token before creating a session.',
    details: [
      'createRequest() creates state and nonce values for both providers. Google also uses S256 PKCE and returns a codeVerifier for the backend exchange.',
      'Pass the full Google callback URL including its query, or the Apple callback URL and raw form-encoded POST body. readCallback() returns success, cancelled or denied and rejects invalid callbacks.',
      'Keep provider secrets on the backend. Consume each transaction once and verify the ID token signature, issuer, audience, expiry and nonce before issuing an app session.'
    ],
    guide: 'https://github.com/ursnj/nayan-ui/blob/main/packages/nayan-ui/README.md#auth'
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
    description: 'Persist settings, values and query caches in named stores. Android and iOS also support opt-in encryption at rest.',
    code: `import { createStorage, useStorage } from 'nayan-ui/storage';
import { NSwitch } from 'nayan-ui/components';

const preferences = createStorage({ id: 'preferences' });

export function SoundSetting() {
  const [enabled, setEnabled] = useStorage('sound', true, preferences);
  return <NSwitch label="Sound" value={enabled} onValueChange={setEnabled} />;
}`,
    note: 'On iOS and Android, supply an app-managed encryptionKey for encrypted storage. Browsers support ordinary storage only.',
    details: [
      'Store strings, numbers, booleans, bytes or JSON. useStorage() and useStorageJSON() subscribe to changes. Native writes are buffered until flush() or a lifecycle flush.',
      'Native encryption supports AES-128 and AES-256. A matching key is required on every reopen. Use isEncrypted to inspect the mode, encrypt(newKey, type) to rotate, or decrypt() to rewrite the store as plaintext.',
      'The application generates and protects the key. Browser storage uses localStorage and rejects encryption requests.'
    ],
    guide: 'https://github.com/ursnj/nayan-ui/blob/main/packages/nayan-ui/README.md#encrypted-storage',
    related: [
      { label: 'Store larger binary files', href: '/modules/files' },
      { label: 'Query a SQLite database', href: '/modules/sqlite' }
    ]
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
    note: 'Export your utility recipes from src/theme.ts. Run this in a Bun build script and pass the generated stylesheet URL to NTheme.',
    guide: '/components/theme'
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
    platforms: WEB_PLATFORMS,
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
    platforms: WEB_PLATFORMS,
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
    platforms: NATIVE_PLATFORMS,
    code: `export default {
  expo: {
    name: 'My app',
    slug: 'my-app',
    plugins: ['nayan-ui']
  }
};`,
    filename: 'app.config.js',
    details: [
      'Set imagePicker: true and supply cameraPermission for camera usage text. Use microphonePermission, contactsPermission and locationPermission to configure the corresponding Android permissions and iOS usage descriptions.',
      'Set systemTheme: true to match the app’s startup appearance to its Expo configuration. Custom profiles must include the features your options enable. Rebuild after applying native configuration.'
    ],
    guide: '/react-native/installation',
    related: [
      { label: 'Contacts', href: '/modules/contacts' },
      { label: 'Camera', href: '/modules/camera' },
      { label: 'Theme', href: '/components/theme' }
    ]
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
  platforms: module.platforms ?? ALL_PLATFORMS,
  variations: moduleVariations[module.slug],
  path: `/modules/${module.slug}`,
  importPath: `nayan-ui/${module.entry.slice(2)}`
}));
