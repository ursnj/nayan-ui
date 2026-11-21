import { expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const engine = resolve(import.meta.dir, '../..');
const archive = resolve(engine, 'native/core/build/EngineCore.xcframework/ios-arm64-simulator/libengine_core.a');

// Requires an Apple Silicon Mac, a fully booted iOS simulator, and the simulator Rust archive.
// NAYAN_IOS_SPEECH_TEST=1 bun test packages/engine/native/tests/speech-ios.test.ts
test.skipIf(process.env.NAYAN_IOS_SPEECH_TEST !== '1')(
  'real iOS speech handles muted queueing, stop-before-start, replay and invalid voices',
  () => {
    const simulators = spawnSync('xcrun', ['simctl', 'list', 'devices', 'booted', '-j'], { encoding: 'utf8' });
    if (simulators.status !== 0) throw new Error(simulators.stderr || String(simulators.error));
    type Device = { udid: string; state: string };
    const devices: Record<string, Device[]> = JSON.parse(simulators.stdout).devices;
    const booted = Object.values(devices)
      .flat()
      .find((device) => device.state === 'Booted');
    if (!booted) throw new Error('Boot an iOS simulator before running this test');
    if (!existsSync(archive)) throw new Error('Build the iOS Rust archive with bun run engine:core:build:ios');
    const directory = mkdtempSync(resolve(tmpdir(), 'engine-speech-ios-'));
    try {
      const executable = resolve(directory, 'EngineSpeechCheck');
      const args = [
        '--sdk',
        'iphonesimulator',
        'clang',
        '-target',
        'arm64-apple-ios16.0-simulator',
        '-fobjc-arc',
        '-fblocks',
        '-I',
        resolve(engine, 'native/core/include'),
        resolve(import.meta.dir, 'fixtures/speech-ios.m'),
        archive,
        '-lc++',
        '-Wl,-w',
        '-o',
        executable
      ];
      for (const framework of [
        'AVFAudio',
        'AudioToolbox',
        'CoreAudio',
        'CoreHaptics',
        'CoreText',
        'Foundation',
        'Metal',
        'QuartzCore',
        'UIKit',
        'CoreGraphics'
      ]) {
        args.push('-framework', framework);
      }
      const build = spawnSync('xcrun', args, { encoding: 'utf8', timeout: 30000 });
      if (build.status !== 0) throw new Error(build.stderr || String(build.error));
      const run = spawnSync('xcrun', ['simctl', 'spawn', booted.udid, executable], { encoding: 'utf8', timeout: 25000 });
      if (run.status !== 0) throw new Error(`${run.stdout}\n${run.stderr}\n${run.error ?? ''}`);
      expect(run.stdout.match(/ok=1/g)).toHaveLength(13);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  },
  60000
);
