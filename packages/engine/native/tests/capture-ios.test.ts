import { expect, test } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// NAYAN_IOS_CAPTURE_TEST=1 bun test packages/engine/native/tests/capture-ios.test.ts
test.skipIf(process.env.NAYAN_IOS_CAPTURE_TEST !== '1')(
  'iOS PNG capture includes a presented Metal drawable',
  async () => {
    async function run(command: string[]) {
      const child = Bun.spawn(command, { stdout: 'pipe', stderr: 'pipe' });
      const [output, error, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
      if (code !== 0) throw new Error(`${command[0]} failed (${code}): ${error}\n${output}`);
      return output.trim();
    }
    const devices = JSON.parse(await run(['xcrun', 'simctl', 'list', 'devices', 'booted', '-j'])) as { devices: Record<string, { udid: string }[]> };
    const simulator = Object.values(devices.devices).flat()[0]?.udid;
    if (!simulator) throw new Error('Boot an iOS simulator before running the native capture test');
    const directory = await mkdtemp(join(tmpdir(), 'nayan-capture-ios-'));
    const bundle = 'check.nayan.capture';
    try {
      const app = join(directory, 'CaptureCheck.app');
      await run(['mkdir', '-p', app]);
      const manifest = join(app, 'Info.plist');
      await writeFile(
        manifest,
        JSON.stringify({
          CFBundleIdentifier: bundle,
          CFBundleExecutable: 'CaptureCheck',
          CFBundleName: 'CaptureCheck',
          CFBundlePackageType: 'APPL',
          CFBundleVersion: '1',
          CFBundleShortVersionString: '1.0',
          MinimumOSVersion: '16.4',
          LSRequiresIPhoneOS: true,
          UIDeviceFamily: [1, 2],
          UIApplicationSceneManifest: {
            UIApplicationSupportsMultipleScenes: false,
            UISceneConfigurations: {
              UIWindowSceneSessionRoleApplication: [{ UISceneConfigurationName: 'Default', UISceneDelegateClassName: 'Scene' }]
            }
          },
          UILaunchScreen: {}
        })
      );
      await run(['plutil', '-convert', 'xml1', manifest]);
      const sdk = await run(['xcrun', '--sdk', 'iphonesimulator', '--show-sdk-path']);
      await run([
        'xcrun',
        '--sdk',
        'iphonesimulator',
        'clang++',
        '-std=c++20',
        '-fobjc-arc',
        '-fblocks',
        '-target',
        `${process.arch === 'arm64' ? 'arm64' : 'x86_64'}-apple-ios16.4-simulator`,
        '-isysroot',
        sdk,
        '-I',
        resolve(import.meta.dir, '..'),
        resolve(import.meta.dir, 'fixtures/capture-ios.mm'),
        resolve(import.meta.dir, '../capture/ios/Capture.mm'),
        '-framework',
        'UIKit',
        '-framework',
        'Foundation',
        '-framework',
        'Metal',
        '-framework',
        'QuartzCore',
        '-framework',
        'CoreGraphics',
        '-o',
        join(app, 'CaptureCheck')
      ]);
      await run(['codesign', '--force', '--sign', '-', app]);
      await run(['xcrun', 'simctl', 'install', simulator, app]);
      // A repeated test keeps its sandbox; clear the old result before the new process starts.
      const data = await run(['xcrun', 'simctl', 'get_app_container', simulator, bundle, 'data']);
      const result = join(data, 'Documents/result.txt');
      await rm(result, { force: true });
      await run(['xcrun', 'simctl', 'launch', '--terminate-running-process', simulator, bundle]);
      for (let i = 0; i < 200; i++) {
        const output = await readFile(result, 'utf8').catch(() => '');
        if (output) {
          expect(output).toStartWith('PASS:');
          return;
        }
        await Bun.sleep(100);
      }
      throw new Error('The native iOS capture fixture did not finish');
    } finally {
      await run(['xcrun', 'simctl', 'uninstall', simulator, bundle]).catch(() => {});
      await rm(directory, { recursive: true, force: true });
    }
  },
  60_000
);
