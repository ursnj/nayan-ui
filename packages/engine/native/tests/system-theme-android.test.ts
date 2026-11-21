import { expect, test } from 'bun:test';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import reactNative from 'react-native/package.json';

// Requires a booted AVD with an engine-enabled debug APK installed. No Metro or API is used.
// Set NAYAN_ANDROID_TEST_APP_ID to the APK application ID. Set NAYAN_ANDROID_TEST_KEYSTORE
// if it was signed with a different debug keystore than ~/.android/debug.keystore.
// NAYAN_ANDROID_SYSTEM_THEME_TEST=1 bun test packages/engine/native/tests/system-theme-android.test.ts
test.skipIf(process.env.NAYAN_ANDROID_SYSTEM_THEME_TEST !== '1')(
  'Android window theme restores startup colors, persists root themes and preserves transparent modals',
  async () => {
    const appId = process.env.NAYAN_ANDROID_TEST_APP_ID;
    if (!appId || !/^[a-zA-Z_][\w]*(?:\.[a-zA-Z_][\w]*)+$/.test(appId)) {
      throw new Error('Set NAYAN_ANDROID_TEST_APP_ID to the installed debug APK application ID');
    }
    const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || join(homedir(), 'Library/Android/sdk');
    const adb = join(sdk, 'platform-tools/adb');
    async function run(command: string[], binary = false) {
      const child = Bun.spawn(command, { stdout: 'pipe', stderr: 'pipe' });
      const [output, error, code] = await Promise.all([new Response(child.stdout).arrayBuffer(), new Response(child.stderr).text(), child.exited]);
      if (code !== 0) throw new Error(`${command[0]} failed (${code}): ${error}\n${new TextDecoder().decode(output)}`);
      return binary ? new Uint8Array(output) : new TextDecoder().decode(output);
    }
    expect(String(await run([adb, 'shell', 'getprop', 'ro.kernel.qemu'])).trim(), 'Use a test emulator, not a physical device').toBe('1');
    const sortVersions = (values: string[]) => values.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    const platform = sortVersions((await readdir(join(sdk, 'platforms'))).filter((name) => name.startsWith('android-')))[0]!;
    const tools = join(sdk, 'build-tools', sortVersions(await readdir(join(sdk, 'build-tools')))[0]!);
    const android = join(sdk, 'platforms', platform, 'android.jar');
    const version = reactNative.version;
    const cache = join(homedir(), '.gradle/caches/modules-2/files-2.1/com.facebook.react/react-android', version);
    let archive: string | undefined;
    for await (const file of new Bun.Glob('**/*-debug.aar').scan({ cwd: cache, absolute: true })) {
      archive = file;
      break;
    }
    if (!archive) throw new Error('Build the host debug APK first to populate the React Android cache');
    const directory = await mkdtemp(join(tmpdir(), 'nayan-system-theme-'));
    try {
      const react = join(directory, 'react.jar');
      await writeFile(react, await run(['unzip', '-p', archive, 'classes.jar'], true));
      for (const [fixture, name] of [
        ['system-theme-android.java', 'Check.java'],
        ['capture-context-android.java', 'TestCaptureContext.java']
      ])
        await writeFile(join(directory, name!), await Bun.file(resolve(import.meta.dir, 'fixtures', fixture!)).text());
      const classes = join(directory, 'classes');
      await run(['mkdir', '-p', classes]);
      await run([
        'javac',
        '-source',
        '11',
        '-target',
        '11',
        '-cp',
        `${android}:${react}`,
        '-d',
        classes,
        join(directory, 'Check.java'),
        join(directory, 'TestCaptureContext.java')
      ]);
      const jar = join(directory, 'test.jar');
      await run(['jar', 'cf', jar, '-C', classes, '.']);
      await run([join(tools, 'd8'), '--lib', android, '--classpath', react, '--output', directory, jar]);
      const manifest = join(directory, 'AndroidManifest.xml');
      await writeFile(
        manifest,
        `<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="check.systemtheme"><uses-sdk android:minSdkVersion="24" android:targetSdkVersion="${platform.split('-')[1]!.split('.')[0]}"/><application android:debuggable="true" android:hasCode="true"/><instrumentation android:name="check.systemtheme.Check" android:targetPackage="${appId}"/></manifest>`
      );
      const apk = join(directory, 'test.apk');
      await run([join(tools, 'aapt2'), 'link', '-I', android, '--manifest', manifest, '-o', apk]);
      await run(['zip', '-j', apk, join(directory, 'classes.dex')]);
      await run([
        join(tools, 'apksigner'),
        'sign',
        '--ks',
        process.env.NAYAN_ANDROID_TEST_KEYSTORE || join(homedir(), '.android/debug.keystore'),
        '--ks-key-alias',
        'androiddebugkey',
        '--ks-pass',
        'pass:android',
        '--key-pass',
        'pass:android',
        apk
      ]);
      await run([adb, 'install', '-r', apk]);
      const output = String(await run([adb, 'shell', 'am', 'instrument', '-w', 'check.systemtheme/check.systemtheme.Check']));
      expect(output).toContain('PASS native system theme:');
    } finally {
      await run([adb, 'uninstall', 'check.systemtheme']).catch(() => {});
      await rm(directory, { recursive: true, force: true });
    }
  },
  90_000
);
