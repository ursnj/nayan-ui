// Lightweight loading scenes rendered by the same Rust/WASM world as gameplay.
import {
  type AnimateTarget,
  type Camera,
  type Color,
  type Entity,
  extrude,
  type Font,
  measureText,
  merge,
  type Model,
  Path,
  World
} from '@nayan-ui/engine';
import { GAMES_METADATA } from '../../services/GamesMetadata';
import { GAME_IDS, type GameThemeMode } from '../../services/UtilsService';
import { cacheGameAsset, createGameMesh } from './EngineMeshes';
import { frontLight, toColor, toRgb } from './EngineUtils';

type LoadingScene = 'car';
interface LoadingColours {
  sky: string;
  horizon: string;
  ground: string;
  accent: string;
  second: string;
  text: string;
  muted: string;
}
interface Look {
  scene: LoadingScene;
  tag: string;
  message: string;
  dark: LoadingColours;
  light: LoadingColours;
}
// Kept independent of game modules: reading a loader palette must never start model/texture loading.
const palette = (sky: string, horizon: string, ground: string, accent: string, second: string, text: string, muted: string): LoadingColours => ({
  sky,
  horizon,
  ground,
  accent,
  second,
  text,
  muted
});
const LOOKS: Partial<Record<GAME_IDS, Look>> = {
  [GAME_IDS.CAR_RACING]: {
    scene: 'car',
    tag: 'START YOUR ENGINES',
    message: 'Your red racer. A fresh stretch of road.',
    dark: palette('#111C29', '#293948', '#151E28', '#FF6A68', '#F1CC7A', '#F6F5ED', '#BEC6CD'),
    light: palette('#ECF0F3', '#CAD6DD', '#A5B4BC', '#B93038', '#88703F', '#27333E', '#5C6A73')
  }
};
const DEFAULT = LOOKS[GAME_IDS.CAR_RACING]!;

export function loadingLook(gameId: GAME_IDS, mode?: GameThemeMode): Look & { colours: LoadingColours } {
  const look = LOOKS[gameId] ?? { ...DEFAULT, tag: 'READY FOR A NEW ROUND', message: 'A little playtime is on its way.' };
  return { ...look, colours: mode === 'light' ? look.light : look.dark };
}
export const LOADING_LIGHT = frontLight([0, 0, 1], 1);
const primitives = new Map<string, Model>();
function shape(key: string, path: () => Path, flipY = false): Model {
  let mesh = primitives.get(key);
  if (!mesh) {
    mesh = cacheGameAsset(`shared/EngineLoading:${key}`, () => {
      const geometry = extrude(path(), { depth: 0 });
      // Illustration paths use engine coordinates; Path extrusions normally flip SVG's downwards y.
      return createGameMesh(flipY ? merge([{ geometry, scale: [1, -1, 1] }]) : geometry, { center: false });
    });
    primitives.set(key, mesh);
  }
  return mesh;
}
const circle = () => shape('circle', () => new Path().addCircle(0, 0, 0.5));
const rect = () => shape('rect', () => new Path().addRoundedRect(-0.5, -0.5, 1, 1, 0.12));
const vector = (key: string, svg: string) => shape(key, () => Path.fromSVG(svg), true);
const STAR = 'M0 11L3 3L11 0L3-3L0-11L-3-3L-11 0L-3 3Z';
const gradients = new Map<string, Model>();
function background(colours: LoadingColours): Model {
  const key = `${colours.sky}:${colours.horizon}:${colours.ground}`;
  let mesh = gradients.get(key);
  if (!mesh) {
    mesh = cacheGameAsset(`shared/EngineLoading:gradient:${key}`, () => {
      const vertices: number[] = [],
        indices: number[] = [];
      for (const [row, colour] of [colours.sky, colours.horizon, colours.ground].entries()) {
        const [r, g, b] = toColor(colour);
        for (const x of [0, 1]) vertices.push(x, -row / 2, 0, 0, 0, 1, r, g, b, 0, 0);
      }
      for (let row = 0; row < 2; row++) {
        const i = row * 2;
        indices.push(i, i + 2, i + 1, i + 1, i + 2, i + 3);
      }
      return createGameMesh({ vertices: new Float32Array(vertices), indices: new Uint32Array(indices) }, { center: false });
    });
    gradients.set(key, mesh);
  }
  return mesh;
}
export function loadingPlacement(width: number, height: number, offset = 0) {
  const scale = Math.max(0.1, Math.min((width - 30) / 360, (height - offset - 24) / 620));
  const top = offset + Math.max(12, (height - offset - 590 * scale) / 2);
  return { scale, top, retryBounds: { left: width / 2 - 90 * scale, top: top + 542 * scale, width: 180 * scale, height: 46 * scale } };
}

interface LoadingStatus {
  label: string;
  error: boolean;
  message?: string;
  retry: boolean;
  reducedMotion: boolean;
}
interface Motion {
  entity: Entity;
  initial: AnimateTarget;
  target: Parameters<World['animate']>[1];
  options: Parameters<World['animate']>[2];
}

export class EngineLoading {
  readonly world = new World(512);
  readonly camera: Camera = { eye: [200, -425, 100], target: [200, -425, 0], fov: 1, ortho: 425 };
  readonly look: ReturnType<typeof loadingLook>;
  readonly clearColor: readonly [number, number, number];
  private backdrop: Entity;
  private content: Entity;
  private progress: Entity;
  private retryButton: Entity;
  private statusText: Entity | null = null;
  private messageText: Entity[] = [];
  private motions: Motion[] = [];
  private status: LoadingStatus = { label: '', error: false, retry: false, reducedMotion: true };
  private disposed = false;
  private retryBox = { left: 0, top: 0, width: 0, height: 0 };

  constructor(
    gameId: GAME_IDS,
    mode: GameThemeMode | undefined,
    private font: Font
  ) {
    this.look = loadingLook(gameId, mode);
    const c = this.look.colours;
    this.clearColor = toRgb(c.sky);
    this.backdrop = this.world.spawn({ mesh: background(c), pickable: false });
    this.content = this.world.spawn({ mesh: 'none', position: [200, -70, 5], pickable: false });
    // Soft, colourful atmosphere made from shared engine primitives.
    for (let i = 0; i < 7; i++)
      this.disc(this.content, Math.sin(i * 2.4) * 175, 25 + i * 75, 45 + i * 13, 45 + i * 13, toColor(i % 2 ? c.accent : c.second, 0.055), -1);
    this.box(this.content, 0, 28, 230, 32, toColor(c.accent, 0.14));
    this.text(this.content, this.look.tag, 0, 28, 10, c.accent, 210);
    const hero = this.world.spawn({ mesh: 'none', parent: this.content, position: [0, -215, 4], pickable: false });
    this.disc(hero, 0, 105, 245, 25, toColor('#000000', 0.16), -2);
    this.drawHero(hero);
    this.motion(hero, { moveBy: [0, 7, 0] }, { duration: 1.5, repeat: 'forever', yoyo: true, easing: 'easeInOut' }, { position: [0, -215, 4] });
    for (const [i, x] of [-140, 140, -112, 114].entries()) {
      const star = this.path(hero, 'star', STAR, x, i % 2 ? -67 : -110, i % 2 ? c.second : c.accent, 0.5 + i * 0.1);
      this.motion(star, { scale: 0.85 + i * 0.12 }, { duration: 0.9 + i * 0.12, repeat: 'forever', yoyo: true }, { scale: 0.5 + i * 0.1 });
    }
    this.text(this.content, GAMES_METADATA[gameId].title, 0, 385, 30, c.text, 330);
    this.text(this.content, this.look.message, 0, 425, 13, c.muted, 330);
    this.progress = this.world.spawn({ mesh: 'none', parent: this.content, position: [0, -485, 5], pickable: false });
    this.box(this.progress, 0, 0, 290, 14, toColor(c.accent, 0.14));
    const sweep = this.box(this.progress, -108, 0, 64, 10, toColor(c.accent));
    this.motion(sweep, { position: [108, 0, 1] }, { duration: 1.3, repeat: 'forever', yoyo: true, easing: 'easeInOut' }, { position: [-108, 0, 1] });
    for (let i = 0; i < 3; i++) {
      const dot = this.disc(this.progress, -15 + i * 15, 62, 6, 6, toColor(c.accent, 0.5));
      this.motion(
        dot,
        { scale: [9, 9, 1], color: toColor(c.accent, 1) },
        { duration: 0.55, delay: i * 0.16, repeat: 'forever', yoyo: true },
        { scale: [6, 6, 1], color: toColor(c.accent, 0.5) }
      );
    }
    this.retryButton = this.world.spawn({ mesh: 'none', parent: this.content, position: [0, -565, 6], scale: 0, pickable: false });
    this.box(this.retryButton, 0, 0, 180, 46, toColor(c.accent));
    this.text(this.retryButton, 'Try again', 0, 0, 16, c.sky, 160);
  }
  private box(parent: Entity, x: number, y: number, w: number, h: number, color: Color, z = 1): Entity {
    return this.world.spawn({ mesh: rect(), parent, position: [x, -y, z], scale: [w, h, 1], color, pickable: false });
  }
  private disc(parent: Entity, x: number, y: number, w: number, h: number, color: Color, z = 1): Entity {
    return this.world.spawn({ mesh: circle(), parent, position: [x, -y, z], scale: [w, h, 1], color, pickable: false });
  }
  private path(parent: Entity, key: string, svg: string, x: number, y: number, color: string, scale = 1, z = 2): Entity {
    return this.world.spawn({ mesh: vector(key, svg), parent, position: [x, -y, z], scale, color: toColor(color), pickable: false });
  }
  private text(parent: Entity, text: string, x: number, y: number, size: number, colour: string, max = 330): Entity {
    const measured = measureText(this.font, text);
    return this.world.spawn({
      text,
      font: this.font,
      parent,
      position: [x, -y, 10],
      scale: Math.min(size, max / Math.max(1, measured)),
      color: toColor(colour),
      pickable: false
    });
  }
  private motion(entity: Entity, target: Motion['target'], options: Motion['options'], initial: Motion['initial']) {
    this.motions.push({ entity, target, options, initial });
  }
  private drawHero(root: Entity) {
    const c = this.look.colours;
    // A street with its skyline, the dashes scrolling by, and the red racer.
    for (let i = 0; i < 6; i++) {
      const x = -142 + i * 55,
        height = 45 + (i % 3) * 23;
      this.box(root, x, 25 - height / 2, 42, height, toColor(c.horizon, 0.8), -1);
      for (let row = 0; row < 2; row++)
        for (let col = 0; col < 2; col++) this.box(root, x - 9 + col * 18, 20 - height + 14 + row * 18, 7, 8, toColor(c.second, 0.6), 0);
    }
    this.box(root, 0, 76, 320, 51, toColor('#303C47'));
    this.box(root, 0, 52, 320, 3, toColor('#F1D998'));
    this.box(root, 0, 100, 320, 3, toColor('#F1D998'));
    for (let x = -140; x <= 140; x += 70) {
      const dash = this.box(root, x, 76, 34, 3, toColor('#FFFFFF', 0.6));
      this.motion(dash, { moveBy: [-24, 0, 0] }, { duration: 0.8, repeat: 'forever', easing: 'linear' }, { position: [x, -76, 1] });
    }
    this.box(root, 0, 10, 218, 66, toColor('#EF575B'), 3);
    this.path(root, 'roof', 'M-72 0L-46 47H39L79 0Z', 0, -23, '#D94248', 1, 4);
    this.path(root, 'window', 'M-48 0L-31 29H-5V0ZM5 0V29H29L53 0Z', 0, -33, '#BCE0E5', 1, 5);
    this.box(root, -94, 8, 22, 12, toColor('#FFE5AA'), 6);
    this.box(root, 97, 10, 14, 16, toColor('#FFD49B'), 6);
    for (const x of [-66, 66]) {
      this.disc(root, x, 44, 49, 49, toColor('#253342'), 6);
      this.disc(root, x, 44, 24, 24, toColor('#C9D2D5'), 7);
    }
  }
  layout(width: number, height: number, offset = 0) {
    const { scale, top, retryBounds } = loadingPlacement(width, height, offset);
    this.world.set(this.backdrop, { scale: [width, height, 1] });
    this.world.set(this.content, { position: [width / 2, -top, 5], scale });
    this.camera.eye = [width / 2, -height / 2, 100];
    this.camera.target = [width / 2, -height / 2, 0];
    this.camera.ortho = height / 2;
    this.retryBox = retryBounds;
  }
  get retryBounds() {
    return this.retryBox;
  }
  setStatus(status: LoadingStatus) {
    if (this.disposed) return;
    const c = this.look.colours;
    if (status.label !== this.status.label || status.error !== this.status.error) {
      if (this.statusText !== null) this.world.despawn(this.statusText);
      this.statusText = this.text(this.content, status.error ? 'A little bump along the way' : `${status.label}…`, 0, 520, 13, c.text, 315);
    }
    if (status.message !== this.status.message || status.error !== this.status.error) {
      for (const entity of this.messageText) this.world.despawn(entity);
      this.messageText = [];
      if (status.error && status.message) {
        const lines: string[] = [];
        let line = '';
        const words = status.message
          .slice(0, 240)
          .split(/\s+/)
          .flatMap((word) => word.match(/.{1,40}/gu) ?? []);
        for (const word of words) {
          const next = line ? `${line} ${word}` : word;
          if (line && measureText(this.font, next) * 12 > 325) {
            lines.push(line);
            line = word;
          } else line = next;
        }
        if (line) lines.push(line);
        for (const [i, text] of lines.slice(0, 3).entries()) this.messageText.push(this.text(this.content, text, 0, 452 + i * 16, 12, c.muted, 325));
      }
    }
    this.world.set(this.progress, { scale: status.error ? 0 : 1 });
    this.world.set(this.retryButton, { scale: status.error && status.retry ? 1 : 0 });
    if (status.reducedMotion !== this.status.reducedMotion || status.error !== this.status.error) {
      for (const motion of this.motions) {
        this.world.stopAnimation(motion.entity);
        this.world.set(motion.entity, motion.initial);
        if (!status.reducedMotion && !status.error) this.world.animate(motion.entity, motion.target, motion.options);
      }
    }
    this.status = { ...status };
  }
  update(dt: number) {
    if (!this.disposed) this.world.update(dt);
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.world.dispose();
  }
}
