import { expect, test } from 'bun:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Build Playtura with simulator signing enabled, then provide its .app directory.
// NAYAN_IOS_SAFE_AREA_TEST=1 NAYAN_IOS_SAFE_AREA_APP=/path/Playtua.app bun test native/tests/safe-area-ios.test.ts
test.skipIf(process.env.NAYAN_IOS_SAFE_AREA_TEST !== '1')(
  'shipped iOS safe-area provider reports OS insets, nested frames and deduplicated changes',
  async () => {
    const app = process.env.NAYAN_IOS_SAFE_AREA_APP;
    if (!app) throw new Error('Set NAYAN_IOS_SAFE_AREA_APP to the current simulator Playtua.app');
    const run = async (command: string[], env = process.env) => {
      const child = Bun.spawn(command, { env, stdout: 'pipe', stderr: 'pipe' });
      const [output, error, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
      if (code) throw new Error(`${command[0]}: ${error}\n${output}`);
      return output.trim();
    };
    const devices = JSON.parse(await run(['xcrun', 'simctl', 'list', 'devices', 'booted', '-j'])) as { devices: Record<string, { udid: string }[]> };
    const simulator = Object.values(devices.devices).flat()[0]?.udid;
    if (!simulator) throw new Error('Boot an iOS simulator first');
    const directory = await mkdtemp(join(tmpdir(), 'nayan-safe-area-ios-'));
    const bundle = 'com.worklage.playtura';
    try {
      const library = join(directory, 'SafeAreaCheck.dylib');
      const sdk = await run(['xcrun', '--sdk', 'iphonesimulator', '--show-sdk-path']);
      await run([
        'xcrun',
        '--sdk',
        'iphonesimulator',
        'clang++',
        '-dynamiclib',
        '-std=c++20',
        '-fobjc-arc',
        '-fblocks',
        '-target',
        `${process.arch === 'arm64' ? 'arm64' : 'x86_64'}-apple-ios16.4-simulator`,
        '-isysroot',
        sdk,
        resolve(import.meta.dir, 'fixtures/safe-area-ios.mm'),
        '-framework',
        'UIKit',
        '-framework',
        'Foundation',
        '-framework',
        'QuartzCore',
        '-o',
        library
      ]);
      await run(['codesign', '--force', '--sign', '-', library]);
      await run(['xcrun', 'simctl', 'install', simulator, app]);
      const data = await run(['xcrun', 'simctl', 'get_app_container', simulator, bundle, 'data']);
      const result = join(data, 'Documents/NayanSafeAreaCheck/result.txt');
      await rm(result, { force: true });
      await run(['xcrun', 'simctl', 'launch', '--terminate-running-process', simulator, bundle], {
        ...process.env,
        SIMCTL_CHILD_DYLD_INSERT_LIBRARIES: library
      });
      for (let i = 0; i < 200; i++) {
        const output = await readFile(result, 'utf8').catch(() => '');
        if (output) {
          expect(output).toStartWith('PASS:');
          return;
        }
        await Bun.sleep(100);
      }
      throw new Error('Native iOS safe-area fixture did not finish');
    } finally {
      await run(['xcrun', 'simctl', 'terminate', simulator, bundle]).catch(() => {});
      await rm(directory, { recursive: true, force: true });
    }
  },
  90_000
);
