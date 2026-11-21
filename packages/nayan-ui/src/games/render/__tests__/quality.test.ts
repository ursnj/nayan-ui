import { describe, expect, test } from 'bun:test';
import { AUTO_STEPS, AutoQuality, levelPixelRatio, median, QUALITIES, QUALITY_LEVELS, rememberQuality, settledQuality, stepLevel } from '../quality';

describe('QUALITY_LEVELS', () => {
  test('every quality name has a level definition', () => {
    for (const q of QUALITIES) {
      expect(QUALITY_LEVELS[q]).toBeDefined();
    }
  });

  test('shadows are drawn from a full-resolution map or not at all, never blurred at low resolution', () => {
    expect(QUALITY_LEVELS.high).toMatchObject({ shadows: true, shadowSize: 2048, softShadows: true });
    expect(QUALITY_LEVELS.medium).toMatchObject({ shadows: true, shadowSize: 2048, softShadows: false });
    for (const q of ['low', 'lowest'] as const) expect(QUALITY_LEVELS[q].shadows).toBe(false);
    for (const q of QUALITIES) expect(QUALITY_LEVELS[q].shadowSize).toBe(2048);
  });

  test('only the reduced-resolution level smooths edges with FXAA (in the pass that stretches it)', () => {
    for (const q of QUALITIES) expect(!!QUALITY_LEVELS[q].fxaa).toBe(QUALITY_LEVELS[q].maxPixels !== undefined);
  });

  test('shadows go before anti-aliasing, and only the last resort reduces resolution', () => {
    expect(QUALITY_LEVELS.medium.samples).toBe(4);
    expect(QUALITY_LEVELS.low.samples).toBe(1);
    expect(QUALITY_LEVELS.high.maxPixelRatio).toBe(3);
    expect(QUALITY_LEVELS.medium.maxPixelRatio).toBe(3);
    expect(QUALITY_LEVELS.low.maxPixelRatio).toBe(3);
    expect(QUALITY_LEVELS.lowest.maxPixelRatio).toBeLessThan(3);
  });
});

describe('median', () => {
  test('ignores a single huge hiccup', () => {
    expect(median([16.6, 16.8, 16.7, 250, 16.7])).toBe(16.7);
    expect(median([10, 20])).toBe(15);
    expect(median([])).toBe(0);
  });
});

// One report per second from `start`; returns the time after the last
function run(aq: AutoQuality, start: number, seconds: number, frameMs: number, renderMs: number) {
  let t = start;
  for (let i = 0; i < seconds; i++) aq.report((t += 1000), { frameMs, renderMs });
  return t;
}
const SLOW = { frameMs: 26, renderMs: 22 }; // ~38 fps, mostly drawing
const SMOOTH = { frameMs: 16.7, renderMs: 12 }; // 60 fps (the draw includes waiting for the screen)
// The steps by name
const [HIGH, HIGH_1_5, HIGH_1_1, MEDIUM, LOW, LOWEST] = [0, 1, 2, 3, 4, 5];

describe('AUTO_STEPS', () => {
  test('runs from the full high level to the last resort', () => {
    expect(AUTO_STEPS[HIGH]).toEqual({ quality: 'high' });
    expect(AUTO_STEPS[LOWEST]).toEqual({ quality: 'lowest' });
    expect(AUTO_STEPS.map((s) => s.quality)).toEqual(['high', 'high', 'high', 'medium', 'low', 'lowest']);
  });

  test('draws the scene a little smaller before giving up an effect', () => {
    expect(stepLevel(AUTO_STEPS[HIGH]!)).toBe(QUALITY_LEVELS.high);
    for (const step of [HIGH_1_5, HIGH_1_1]) {
      const level = stepLevel(AUTO_STEPS[step]!);
      expect(level).toMatchObject({ samples: 4, shadows: true, softShadows: true, shadowSize: 2048 });
      expect(level.fxaa).toBeUndefined();
    }
    expect(stepLevel(AUTO_STEPS[HIGH_1_5]!).maxPixels).toBe(1_500_000);
    expect(stepLevel(AUTO_STEPS[HIGH_1_1]!).maxPixels).toBe(1_100_000);
    // Every later step keeps at most the smallest budget so far
    for (let i = HIGH_1_1; i < AUTO_STEPS.length; i++) expect(stepLevel(AUTO_STEPS[i]!).maxPixels).toBeLessThanOrEqual(1_100_000);
    expect(stepLevel(AUTO_STEPS[LOWEST]!)).toBe(QUALITY_LEVELS.lowest);
  });

  test('a 1200x2000 tablet draws its scene at about 0.8x, then 0.68x, of its resolution', () => {
    const scale = (step: number) => levelPixelRatio(stepLevel(AUTO_STEPS[step]!), 1.75, 1200 / 1.75, 2000 / 1.75) / 1.75;
    expect(scale(HIGH)).toBe(1);
    expect(scale(HIGH_1_5)).toBeCloseTo(0.79, 2);
    expect(scale(HIGH_1_1)).toBeCloseTo(0.68, 2);
  });
});

describe('AutoQuality', () => {
  test('starts at high, full resolution', () => {
    expect(new AutoQuality().quality).toBe('high');
    expect(new AutoQuality().step).toBe(HIGH);
    expect(new AutoQuality().level).toBe(QUALITY_LEVELS.high);
  });

  test("starts at a quality's first step, or a remembered step", () => {
    expect(new AutoQuality('medium').step).toBe(MEDIUM);
    expect(new AutoQuality(HIGH_1_1).step).toBe(HIGH_1_1);
    expect(new AutoQuality(99).step).toBe(LOWEST);
  });

  test('ignores start-up', () => {
    const aq = new AutoQuality();
    aq.report(0, SLOW);
    aq.report(1000, SLOW);
    aq.report(2000, SLOW);
    expect(aq.step).toBe(HIGH);
  });

  test('keeps high on a device holding 60 fps, however long the draw waits for the screen', () => {
    const aq = new AutoQuality();
    run(aq, 0, 30, 16.7, 15.5);
    expect(aq.step).toBe(HIGH);
  });

  test("a hitchy JS thread doesn't cost quality (slow but not drawing-bound)", () => {
    const aq = new AutoQuality();
    run(aq, 0, 30, 28, 6);
    expect(aq.step).toBe(HIGH);
  });

  test('steps down after three consecutive slow, drawing-bound seconds: first to a smaller scene', () => {
    const aq = new AutoQuality();
    let t = run(aq, 0, 3, SMOOTH.frameMs, SMOOTH.renderMs); // past start-up
    t = run(aq, t, 2, SLOW.frameMs, SLOW.renderMs);
    expect(aq.step).toBe(HIGH);
    run(aq, t, 1, SLOW.frameMs, SLOW.renderMs);
    expect(aq.step).toBe(HIGH_1_5);
    expect(aq.quality).toBe('high');
  });

  test('a steady ~53 fps (a visible stutter at 60 Hz) counts as slow', () => {
    const aq = new AutoQuality();
    run(aq, 0, 6, 18.9, 17);
    expect(aq.step).toBe(HIGH_1_5);
  });

  test('one smooth second resets the count', () => {
    const aq = new AutoQuality();
    let t = run(aq, 0, 3, SMOOTH.frameMs, SMOOTH.renderMs);
    t = run(aq, t, 2, SLOW.frameMs, SLOW.renderMs);
    t = run(aq, t, 1, SMOOTH.frameMs, SMOOTH.renderMs);
    run(aq, t, 2, SLOW.frameMs, SLOW.renderMs);
    expect(aq.step).toBe(HIGH);
  });

  test('steps back up after smooth seconds', () => {
    const aq = new AutoQuality();
    let t = run(aq, 0, 3, SMOOTH.frameMs, SMOOTH.renderMs);
    t = run(aq, t, 3, SLOW.frameMs, SLOW.renderMs);
    expect(aq.step).toBe(HIGH_1_5);
    run(aq, t, 13, SMOOTH.frameMs, SMOOTH.renderMs);
    expect(aq.step).toBe(HIGH);
  });

  test('a step that fails again right after being restored becomes the ceiling (no bouncing)', () => {
    const aq = new AutoQuality();
    let t = run(aq, 0, 3, SMOOTH.frameMs, SMOOTH.renderMs);
    t = run(aq, t, 3, SLOW.frameMs, SLOW.renderMs); // full -> 1.5 MP
    t = run(aq, t, 13, SMOOTH.frameMs, SMOOTH.renderMs); // back to full
    expect(aq.step).toBe(HIGH);
    t = run(aq, t, 5, SLOW.frameMs, SLOW.renderMs); // full fails again soon after
    expect(aq.step).toBe(HIGH_1_5);
    run(aq, t, 60, SMOOTH.frameMs, SMOOTH.renderMs);
    expect(aq.step).toBe(HIGH_1_5); // stays put
  });

  test('a plainly struggling device (under ~33 fps, drawing-bound) steps down every couple of seconds', () => {
    const aq = new AutoQuality();
    let t = run(aq, 0, 3, SMOOTH.frameMs, SMOOTH.renderMs); // past start-up
    t = run(aq, t, 1, 45, 40);
    expect(aq.step).toBe(HIGH_1_5);
    t = run(aq, t, 1, 45, 40); // settling after the change
    expect(aq.step).toBe(HIGH_1_5);
    t = run(aq, t, 1, 45, 40);
    expect(aq.step).toBe(HIGH_1_1);
    t = run(aq, t, 2, 45, 40);
    expect(aq.step).toBe(MEDIUM);
    t = run(aq, t, 2, 45, 40);
    expect(aq.quality).toBe('low');
    run(aq, t, 2, 45, 40);
    expect(aq.quality).toBe('lowest');
  });

  test('very slow frames caused by the game loop, not drawing, keep quality', () => {
    const aq = new AutoQuality();
    run(aq, 0, 30, 45, 8);
    expect(aq.step).toBe(HIGH);
  });

  test('walks down to the last resort only if frames keep dropping', () => {
    const aq = new AutoQuality();
    run(aq, 0, 60, SLOW.frameMs, SLOW.renderMs);
    expect(aq.step).toBe(LOWEST);
  });
});

describe('pixel budget', () => {
  test('"lowest" caps the pixels drawn on a low-density tablet, not just the ratio', () => {
    // 1200x2000 device pixels at 1.75x: the ratio cap of 2 alone would draw all 2.4 MP.
    const ratio = levelPixelRatio(QUALITY_LEVELS.lowest, 1.75, 1200 / 1.75, 2000 / 1.75);
    const pixels = (1200 / 1.75) * ratio * ((2000 / 1.75) * ratio);
    expect(pixels).toBeLessThanOrEqual(800_000 + 1);
    expect(ratio).toBeLessThan(1.75);
  });

  test('levels without a budget keep the screen ratio up to their cap', () => {
    expect(levelPixelRatio(QUALITY_LEVELS.high, 2.625, 412, 915)).toBe(2.625);
    expect(levelPixelRatio(QUALITY_LEVELS.lowest, 1, 360, 640)).toBe(1); // small screens are already under budget
  });
});

describe('remembered quality', () => {
  test('auto can start at a remembered step and still steps back up when smooth', () => {
    const aq = new AutoQuality(LOWEST);
    expect(aq.quality).toBe('lowest');
    run(aq, 0, 14, SMOOTH.frameMs, SMOOTH.renderMs);
    expect(aq.quality).toBe('low');
  });

  test('a light scene climbs from a remembered low step within seconds; a near-budget one waits', () => {
    const light = new AutoQuality(LOWEST);
    let t = run(light, 0, 25, 16.7, 6);
    expect(light.step).toBe(HIGH);
    expect(t).toBeLessThan(26_000);
    const busy = new AutoQuality(LOWEST);
    t = run(busy, 0, 9, 16.7, 14);
    expect(busy.step).toBe(LOWEST);
    run(busy, t, 6, 16.7, 14);
    expect(busy.step).toBe(LOW);
  });

  test('held frames (a results card) never change the step, and judging resumes after a settle', () => {
    const aq = new AutoQuality(HIGH_1_5);
    let t = run(aq, 0, 4, SMOOTH.frameMs, SMOOTH.renderMs);
    expect(aq.step).toBe(HIGH_1_5);
    // The card costs 21 ms a frame: held, it neither steps down nor counts towards anything
    for (let i = 0; i < 10; i++) aq.hold((t += 1000));
    expect(aq.step).toBe(HIGH_1_5);
    // Back in play, smooth and light: it climbs once it has settled and seen two seconds
    t = run(aq, t, 1, 16.7, 8);
    expect(aq.step).toBe(HIGH_1_5);
    run(aq, t, 4, 16.7, 8);
    expect(aq.step).toBe(HIGH);
  });

  test('a light scene still climbs when the game loop drops a frame or two a second', () => {
    // 57 fps: just short of smooth, with the GPU idle most of each frame
    const light = new AutoQuality(MEDIUM);
    run(light, 0, 16, 17.6, 6.5);
    expect(light.step).toBe(HIGH);
    // A JS-bound 40 fps game whose draws are light still gets the best step
    const loopBound = new AutoQuality(LOWEST);
    run(loopBound, 0, 25, 25, 7);
    expect(loopBound.step).toBe(HIGH);
  });

  test('steps are remembered per key only', () => {
    rememberQuality('treasure-hunt', LOWEST);
    rememberQuality(undefined, LOW);
    expect(settledQuality('treasure-hunt')).toBe(LOWEST);
    expect(settledQuality('car-racing')).toBeUndefined();
    expect(settledQuality(undefined)).toBeUndefined();
  });

  test('steps persist per game in the durable store and are written only on change', () => {
    const records = new Map<string, ArrayBuffer>();
    let writes = 0;
    const store = {
      cacheRead: (key: string) => records.get(key) ?? new ArrayBuffer(0),
      cacheWrite: (key: string, bytes: ArrayBuffer) => {
        writes++;
        records.set(key, bytes);
        return true;
      }
    };
    rememberQuality('penguin-run', LOW, store);
    rememberQuality('penguin-run', LOW, store);
    expect(writes).toBe(1);
    rememberQuality('penguin-run', LOWEST, store);
    expect(writes).toBe(2);
    expect([...new Uint8Array(records.get('quality-step:penguin-run')!)]).toEqual([LOWEST]);
    // A later launch (nothing in memory) restores it from the store.
    records.set('quality-step:crossy-road', new Uint8Array([HIGH_1_1]).buffer);
    expect(settledQuality('crossy-road', store)).toBe(HIGH_1_1);
    // Records of the former level scale (another key) and out-of-range steps are ignored
    records.set('quality:bike-racing', new Uint8Array([2]).buffer);
    expect(settledQuality('bike-racing', store)).toBeUndefined();
    records.set('quality-step:bike-racing', new Uint8Array([AUTO_STEPS.length]).buffer);
    expect(settledQuality('bike-racing', store)).toBeUndefined();
  });
});
