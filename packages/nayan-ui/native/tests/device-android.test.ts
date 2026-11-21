import { expect, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

test('native Android build detection covers AVD/vendor emulators without treating physical x86/ChromeOS devices as virtual', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'nayan-device-'));
  try {
    const source = join(directory, 'device.cpp');
    const binary = join(directory, 'device');
    await writeFile(
      source,
      `
#include "AndroidDevice.h"
#include <cassert>
int main() {
  using nayan::androidEmulator;
  assert(androidEmulator({"google/sdk_gphone16k_arm64/emu64a:17/release", "sdk_gphone16k_arm64", "Google", "ranchu", "sdk_gphone16k_arm64"}));
  assert(androidEmulator({"generic/sdk:14/test", "Android SDK built for x86", "unknown", "goldfish", "sdk"}));
  assert(androidEmulator({"vendor/build", "VirtualBox", "Genymotion", "vbox86", "vbox86p"}));
  assert(androidEmulator({"vendor/build", "SM-G955F", "samsung", "NOX", "starlte"}));
  assert(androidEmulator({"vendor/build", "Droid4X", "unknown", "hardware", "product"}));
  assert(androidEmulator({"unknown", "device", "unknown", "hardware", "product"}));
  assert(!androidEmulator({"google/tokay/tokay:16/release", "Pixel 9", "Google", "tensor", "tokay", "google", "tokay"}));
  assert(!androidEmulator({"samsung/beyond1ltexx/beyond1:15/release", "SM-G973F", "samsung", "exynos9820", "beyond1ltexx", "samsung", "beyond1"}));
  assert(!androidEmulator({"asus/zenfone:14/release", "ASUS ZenFone", "ASUS", "intel", "zenfone", "asus", "zenfone"}));
  assert(!androidEmulator({"google/cheets:16/release", "Chromebook", "Google", "cheets", "cheets", "google", "cheets"}));
}
`
    );
    const build = Bun.spawn(['c++', '-std=c++20', '-I', resolve(import.meta.dir, '../device/cpp'), source, '-o', binary], {
      stdout: 'pipe',
      stderr: 'pipe'
    });
    const error = await new Response(build.stderr).text();
    expect(await build.exited, error).toBe(0);
    const run = Bun.spawn([binary], { stdout: 'pipe', stderr: 'pipe' });
    expect(await run.exited, await new Response(run.stderr).text()).toBe(0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 30_000);
