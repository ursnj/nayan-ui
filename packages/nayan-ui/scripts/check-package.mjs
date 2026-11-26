import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const metadata = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const required = new Set([
  'LICENSE',
  'README.md',
  'package.json',
  'cli/template.json',
  'NayanEngine.podspec',
  'react-native.config.js',
  'scripts/expo-plugin.cjs',
  'src/native/spec/NativeNayanEngine.ts',
  'shared/cpp/generated/NayanEngineSpecJSI.h',
  'shared/cpp/AppServices.h',
  'shared/cpp/AppServices.android.cpp',
  'shared/cpp/generated/NayanEngineSpecJSI.cpp',
  'shared/ios/AppServices.mm',
  'shared/ios/NayanEngineSurface.mm',
  'shared/ios/PrivacyInfo.xcprivacy',
  'native/permissions/ios/Permissions.h',
  'native/permissions/ios/Permissions.mm',
  'native/location/ios/Location.h',
  'native/location/ios/Location.mm',
  'native/video/ios/NayanEngineVideo.mm',
  'shared/android/src/main/java/com/nayanui/engine/EngineAppServices.java',
  'shared/android/src/main/java/com/nayanui/engine/EngineSurfaceView.java',
  'shared/android/src/main/java/com/nayanui/engine/EngineSurfaceViewManager.java',
  'shared/android/src/main/AndroidManifest.xml',
  'shared/android/CMakeLists.txt',
  'shared/android/codegen/CMakeLists.txt',
  'shared/android/build.gradle',
  'shared/android/proguard-rules.pro',
  'native/sharing/android/res/xml/nayan_engine_sharing_paths.xml',
  'native/permissions/android/enabled/java/com/nayanui/engine/EnginePermissions.java',
  'native/permissions/android/disabled/java/com/nayanui/engine/EnginePermissions.java',
  'native/location/android/enabled/java/com/nayanui/engine/EngineLocation.java',
  'native/location/android/disabled/java/com/nayanui/engine/EngineLocation.java',
  'native/review/android/enabled/java/com/nayanui/engine/EngineStoreReview.java',
  'native/review/android/disabled/java/com/nayanui/engine/EngineStoreReview.java',
  'native/video/android/enabled/java/com/nayanui/engine/EngineVideoView.java',
  'native/video/android/enabled/java/com/nayanui/engine/EngineVideoViewManager.java',
  'native/video/android/disabled/java/com/nayanui/engine/EngineVideoViewManager.java',
  'native/image-picker/android/enabled/java/com/nayanui/engine/EngineImagePicker.java',
  'native/image-picker/android/enabled/java/com/nayanui/engine/EngineImageCropActivity.java',
  'native/image-picker/android/enabled/AndroidManifest.xml',
  'native/image-picker/android/enabled/java/com/nayanui/engine/ImagePickerBinding.java',
  'native/image-picker/android/disabled/java/com/nayanui/engine/ImagePickerBinding.java',
  'native/image-picker/ios/ImagePicker.h',
  'native/image-picker/ios/ImagePicker.mm',
  'native/image-picker/rust/color.rs',
  'native/image-picker/rust/color-matrices.json',
  'src/storage/persister.ts',
  'src/components/PlatformHost.tsx',
  'src/components/PlatformHost.web.tsx',
  'src/components/ThemeServices.tsx',
  'src/components/contextBridge.tsx',
  'src/components/theme/contexts.ts',
  'src/components/theme/useThemeControl.ts',
  'src/components/useNTheme.ts',
  'src/components/toastSnapshot.ts',
  'native/core/include/engine_core.h',
  'native/core/.cargo/config.toml',
  'native/core/Cargo.toml',
  'native/core/Cargo.lock',
  'native/core/src/lib.rs',
  'native/auth/rust/oauth.rs',
  'native/auth/rust/ffi.rs',
  'native/contacts/rust/contacts.rs',
  'native/contacts/rust/ffi.rs',
  'native/contacts/ios/Contacts.h',
  'native/contacts/ios/Contacts.mm',
  'native/contacts/android/enabled/java/com/nayanui/engine/EngineContacts.java',
  'native/contacts/android/disabled/java/com/nayanui/engine/EngineContacts.java',
  'native/games/rust/render/shader.wgsl',
  'native/drawing/THIRD_PARTY_LICENSES.txt',
  'native/core/scripts/features.sh',
  'native/core/scripts/rust-toolchain.sh',
  'native/core/scripts/profile-ios.sh',
  'scripts/features.cjs',
  'lib/web/wasm-runtime.js',
  'lib/web/components/icons/paths/LICENSE.lucide',
  'lib/web/components/icons/paths/package.json',
  'lib/web/components/icons/named/package.json',
  'lib/web/sqlite-worker.js',
  'native/core/scripts/build-android.sh',
  'native/core/scripts/build-web.sh',
  'native/core/build/EngineCore.xcframework/Info.plist',
  'native/core/build/EngineCore.xcframework/ios-arm64/libengine_core.a',
  'native/core/build/EngineCore.xcframework/ios-arm64-simulator/libengine_core.a',
  'lib/web/engine_core_bg.wasm',
  'lib/web/audio-worklet.js'
]);
for (const abi of ['arm64-v8a', 'armeabi-v7a', 'x86_64', 'x86']) required.add(`native/core/build/android/${abi}/libengine_core.a`);
async function exportedFiles(value) {
  if (typeof value === 'string') {
    if (!value.includes('*')) {
      required.add(value);
      return;
    }
    const folder = dirname(value);
    const suffix = value.slice(value.lastIndexOf('*') + 1);
    const names = await readdir(resolve(root, folder)).catch(() => []);
    const icons = names.filter((name) => name.endsWith('.js') || name.endsWith('.d.ts'));
    if (!icons.length) required.add(value);
    for (const icon of icons) required.add(`${folder}/${icon.replace(/\.(?:js|d\.ts)$/, '')}${suffix}`);
  } else {
    for (const item of Object.values(value)) await exportedFiles(item);
  }
}
await exportedFiles(metadata.exports);
for (const path of [metadata.main, metadata.browser, metadata.types, ...Object.values(metadata.bin)]) required.add(path);

const packed = process.argv.includes('--pack-json');
let manifest;
if (packed) {
  let json = '';
  for await (const chunk of process.stdin) json += chunk;
  [manifest] = JSON.parse(json);
  if (manifest?.name !== metadata.name || manifest.version !== metadata.version || !Array.isArray(manifest.files))
    throw new Error(`Expected the npm pack manifest for ${metadata.name}@${metadata.version}.`);
}
const inventory = manifest && new Map(manifest.files.map(({ path, size }) => [path, size]));
const requiredPaths = new Set([...required].map((path) => posix.normalize(path)));
const missing = [];
for (const path of requiredPaths) {
  if (inventory) {
    if (!inventory.get(path)) missing.push(path);
    continue;
  }
  try {
    const info = await stat(resolve(root, path));
    if (!info.isFile() || info.size === 0) missing.push(path);
  } catch {
    missing.push(path);
  }
}
if (missing.length)
  throw new Error(
    `Engine package is incomplete:\n${missing.map((path) => `  ${path}`).join('\n')}\nBuild the native core on macOS and run engine:build before packing or publishing.`
  );
if (inventory) {
  const extra = [...inventory.keys()].filter(
    (path) =>
      /(?:^|\/)(?:__tests__|__mocks__|__fixtures__|examples|fixtures|tests|target|\.gradle|\.cxx)(?:\/|$)|\.(?:map|log)$|\/tests\.rs$/.test(path) ||
      ((path.startsWith('scripts/') || path.startsWith('native/core/scripts/') || path.startsWith('native/core/build/')) &&
        !requiredPaths.has(path)) ||
      /^(?:src|lib\/module|lib\/typescript\/src)\/styles\//.test(path) ||
      path.startsWith('shared/android/build/')
  );
  if (extra.length) throw new Error(`Unexpected engine package files:\n${extra.map((path) => `  ${path}`).join('\n')}`);
  console.error(`Verified ${manifest.entryCount} packed files for ${metadata.version} (${manifest.size} bytes compressed).`);
} else {
  console.error(`Verified ${requiredPaths.size} required engine package files for ${metadata.version}.`);
}
