import { expect, test } from 'bun:test';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Requires a booted test AVD with the current Playtura APK installed and signed out.
// If the APK has no embedded JS bundle, start Metro and make it reachable from the emulator first.
// NAYAN_ANDROID_DRAWER_TEST=1 bun test native/tests/drawer-android.test.ts
test.skipIf(process.env.NAYAN_ANDROID_DRAWER_TEST !== '1')(
  'Android native drawer handles edge swipes, engine menu taps, nested-stack Back and cancellation',
  async () => {
    const adb = join(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || join(homedir(), 'Library/Android/sdk'), 'platform-tools/adb');
    const run = async (...args: string[]) => {
      const child = Bun.spawn([adb, ...args], { stdout: 'pipe', stderr: 'pipe' });
      const [out, error, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
      if (code) throw new Error(`${args.join(' ')}: ${error}\n${out}`);
      return out;
    };
    expect((await run('shell', 'getprop', 'ro.kernel.qemu')).trim(), 'Use a test emulator').toBe('1');
    const size = await run('shell', 'wm', 'size'),
      densityText = await run('shell', 'wm', 'density');
    const dimensions = [...size.matchAll(/(\d+)x(\d+)/g)].at(-1)!;
    const width = Number(dimensions[1]),
      height = Number(dimensions[2]);
    const density = Number([...densityText.matchAll(/density:\s*(\d+)/g)].at(-1)![1]) / 160;
    const wait = () => Bun.sleep(600);
    const tap = async (x: number, y: number) => {
      await run('shell', 'input', 'tap', String(Math.round(x)), String(Math.round(y)));
      await wait();
    };
    const swipe = async (x1: number, x2: number) => {
      await run(
        'shell',
        'input',
        'swipe',
        String(Math.round(x1)),
        String(Math.round(height / 2)),
        String(Math.round(x2)),
        String(Math.round(height / 2)),
        '400'
      );
      await wait();
    };
    const snapshot = '/sdcard/nayan-drawer-regression.xml';
    const hierarchy = async () => {
      await run('shell', 'uiautomator', 'dump', '--compressed', snapshot);
      return run('shell', 'cat', snapshot);
    };
    const menu = async () => {
      const xml = await hierarchy();
      const node = [...xml.matchAll(/<node\b[^>]*>/g)].map((x) => x[0]).find((x) => x.includes('content-desc="Open navigation menu"'));
      expect(node, 'Native router menu button must remain accessible').toBeDefined();
      const b = node!.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/)!;
      await tap((Number(b[1]) + Number(b[3])) / 2, (Number(b[2]) + Number(b[4])) / 2);
    };
    const assertRoute = async (title: string) => {
      const xml = await hierarchy();
      expect(xml).toContain('text="' + title + '"');
      expect(xml).toContain('content-desc="Open navigation menu"');
      expect(await run('shell', 'dumpsys', 'activity', 'activities')).toMatch(/topResumedActivity=.*com\.worklage\.playtura/);
    };
    try {
      await run('shell', 'am', 'force-stop', 'com.worklage.playtura');
      await run('shell', 'am', 'start', '-n', 'com.worklage.playtura/.MainActivity');
      // Cold-start native/font work must finish before interacting with Expo's retained splash.
      await Bun.sleep(20_000);
      await menu();
      await run('shell', 'input', 'keyevent', '4');
      await wait();
      await assertRoute('Playtua');
      // The center of the left edge is excluded from Android's system Back gesture.
      await swipe(3, width * 0.75);
      // Menu rows are Rust-rendered. Header=256dp, inset=20dp, rows=48dp + 4dp gap.
      await tap(120 * density, (256 + 20 + 3 * 52 + 24) * density);
      await assertRoute('About Playtua');
      await menu();
      await run('shell', 'input', 'keyevent', '4');
      await wait();
      await assertRoute('About Playtua');
      await menu();
      await tap(120 * density, (256 + 20 + 24) * density);
      await assertRoute('Playtua');
      // Closing across a pressed menu row must cancel that row, not navigate to About.
      await menu();
      await swipe(260 * density, 30 * density);
      await assertRoute('Playtua');
      await menu();
      await tap(width * 0.95, height / 2);
      await assertRoute('Playtua');
    } finally {
      await run('shell', 'rm', '-f', snapshot).catch(() => {});
    }
  },
  180_000
);
