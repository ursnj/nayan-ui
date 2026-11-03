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

export type LoadingScene = 'forest' | 'penguin' | 'car' | 'bike' | 'ninja' | 'merger' | 'tiles' | 'tua' | 'chameleon' | 'paper' | 'crossing';
export interface LoadingColours {
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
  [GAME_IDS.TREASURE_HUNT]: {
    scene: 'forest',
    tag: 'INTO THE WILD',
    message: 'Follow the river. Find the diamonds.',
    dark: palette('#0D2420', '#234332', '#142E25', '#AED492', '#9BDCE8', '#F0F7E9', '#BED0B9'),
    light: palette('#E5EDDF', '#BDCFAC', '#95B18A', '#386747', '#347C8B', '#253C2B', '#51674F')
  },
  [GAME_IDS.PENGUIN_RUN]: {
    scene: 'penguin',
    tag: 'JUNGLE DASH',
    message: 'Through the jungle. Over the ruins.',
    dark: palette('#112B28', '#2C4B3D', '#172C28', '#FFBD58', '#95B484', '#FFF7E8', '#C8D1BC'),
    light: palette('#E7EBDD', '#C1D0AB', '#8DA988', '#916027', '#446C48', '#2C3B31', '#596A52')
  },
  [GAME_IDS.CAR_RACING]: {
    scene: 'car',
    tag: 'START YOUR ENGINES',
    message: 'Your red racer. A fresh stretch of road.',
    dark: palette('#111C29', '#293948', '#151E28', '#FF6A68', '#F1CC7A', '#F6F5ED', '#BEC6CD'),
    light: palette('#ECF0F3', '#CAD6DD', '#A5B4BC', '#B93038', '#88703F', '#27333E', '#5C6A73')
  },
  [GAME_IDS.BIKE_RACING]: {
    scene: 'bike',
    tag: 'READY TO RIDE',
    message: 'Lean in. The open road awaits.',
    dark: palette('#121E28', '#2C3A43', '#16222A', '#FFA153', '#E9D4A5', '#FBF5EB', '#C8C9BE'),
    light: palette('#EDF0EC', '#CCD8D5', '#A3B5AB', '#A3551B', '#786846', '#2C3835', '#5A6A61')
  },
  [GAME_IDS.FRUIT_NINJA]: {
    scene: 'ninja',
    tag: 'SLICE INTO ACTION',
    message: 'Fresh fruit. One perfect slice.',
    dark: palette('#152C24', '#35513B', '#1C3026', '#FFAA82', '#B8D492', '#FFF7E9', '#C8D3B9'),
    light: palette('#EEF1DE', '#CDDBB5', '#A1B582', '#AA4734', '#476A39', '#334329', '#616E4C')
  },
  [GAME_IDS.FRUIT_MERGER]: {
    scene: 'merger',
    tag: 'SMALL FRUIT. BIG FUN.',
    message: 'Drop. Match. Make something bigger.',
    dark: palette('#241D37', '#443459', '#2B233D', '#FFBE79', '#ECCF9B', '#FFF5E7', '#D6C8E1'),
    light: palette('#F1EAF5', '#E1D4EB', '#CDBFDD', '#9C5728', '#A35568', '#43304E', '#75617F')
  },
  [GAME_IDS.TILE_HOME]: {
    scene: 'tiles',
    tag: 'THREE OF A KIND',
    message: 'A perfect little match is waiting.',
    dark: palette('#241F38', '#44365D', '#2D2540', '#CAB0F1', '#F2DCB9', '#FFF8EE', '#D5C9E4'),
    light: palette('#F3EDF6', '#E3D9EE', '#D0C4DE', '#75528E', '#937341', '#44334F', '#786685')
  },
  [GAME_IDS.PLAY_WITH_TUA]: {
    scene: 'tua',
    tag: 'YOUR PLAYFUL COMPANION',
    message: 'Wave, laugh and play with Tua.',
    dark: palette('#281F3D', '#493763', '#21333A', '#D0AFF2', '#8ED4C5', '#FCF4FF', '#D3C4E5'),
    light: palette('#F2EAF9', '#DCCDEC', '#C3DDD5', '#8055AB', '#347F76', '#473255', '#766282')
  },
  [GAME_IDS.CHAMELEON_RUN]: {
    scene: 'chameleon',
    tag: 'SWITCH. JUMP. RUN.',
    message: 'Yellow or pink? Find your rhythm.',
    dark: palette('#1A2A38', '#344A5B', '#1C2D3A', '#FFD447', '#F653A6', '#FFF7E2', '#C6D2D8'),
    light: palette('#E9F0F0', '#CBDEE0', '#AEC7CD', '#8D6921', '#B63B7D', '#30454F', '#5E7480')
  },
  [GAME_IDS.PAPER_IO]: {
    scene: 'paper',
    tag: 'MAKE YOUR MARK',
    message: 'Paint your path. Claim your world.',
    dark: palette('#221F33', '#3B354C', '#28263B', '#88D693', '#F58B8B', '#F5F6EF', '#C7CED1'),
    light: palette('#F0EDF5', '#DDD7E7', '#C9C4D8', '#3B7D47', '#B4474D', '#364438', '#65706C')
  },
  [GAME_IDS.CROSSY_ROAD]: {
    scene: 'crossing',
    tag: 'ONE HOP AT A TIME',
    message: 'Watch the traffic. Make your move.',
    dark: palette('#1A2B2E', '#344D43', '#294732', '#EDD785', '#9AC984', '#FCF6E3', '#CDD5BE'),
    light: palette('#EAF0E7', '#C7D8BC', '#9BBB80', '#886727', '#4A7544', '#34462E', '#617454')
  }
};
const DEFAULT = LOOKS[GAME_IDS.TILE_HOME]!;

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
const DIAMOND = 'M-20 3L-10 16H10L20 3L0-23Z';
const LEAF = 'M0 0Q-5 24 25 20Q24-3 0 0Z';
const PINE = 'M0 65L-24 23H-12L-31-5H-16L-39-35H39L16-5H31L12 23H24Z';
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

export interface LoadingStatus {
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
  private tree(root: Entity, x: number, y: number, scale: number, colour: string) {
    this.box(root, x, y + 35, 7 * scale, 70 * scale, toColor('#75604B'));
    this.path(root, 'pine', PINE, x, y, colour, scale);
  }
  private fruit(root: Entity, x: number, y: number, size: number, colour: string) {
    this.disc(root, x, y, size, size, toColor(colour));
    this.disc(root, x - size * 0.22, y - size * 0.18, size * 0.18, size * 0.3, toColor('#FFFFFF', 0.3), 2);
    this.path(root, 'leaf', LEAF, x, y - size * 0.45, '#74BA65', size / 75, 3);
  }
  private drawHero(root: Entity) {
    const c = this.look.colours,
      scene = this.look.scene;
    if (scene === 'forest' || scene === 'penguin' || scene === 'ninja') {
      this.disc(root, 0, 82, 310, 88, toColor('#426C48'));
      this.disc(root, 12, 103, 275, 35, toColor('#284F39'));
      this.tree(root, -112, -3, 0.9, '#578257');
      this.tree(root, 110, 10, 0.85, '#345E44');
      this.tree(root, -73, -28, 0.58, '#81A96C');
    }
    if (scene === 'forest') {
      this.path(root, 'river', 'M-45-105Q20-65-20-30Q-60 5 4 28L16 12Q-31-3-4-24Q42-62-24-110Z', 0, 0, '#6EBACB', 1, 2);
      this.box(root, -5, 55, 67, 12, toColor('#DFCAA0'), 3);
      this.path(root, 'diamond', DIAMOND, 8, -60, '#A9EBF7', 2, 5);
      this.path(root, 'diamond', DIAMOND, 120, 62, '#D2F8FF', 0.55, 5);
      return;
    }
    if (scene === 'car' || scene === 'bike' || scene === 'crossing') {
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
      if (scene === 'car') {
        this.box(root, 0, 10, 218, 66, toColor('#EF575B'), 3);
        this.path(root, 'roof', 'M-72 0L-46 47H39L79 0Z', 0, -23, '#D94248', 1, 4);
        this.path(root, 'window', 'M-48 0L-31 29H-5V0ZM5 0V29H29L53 0Z', 0, -33, '#BCE0E5', 1, 5);
        this.box(root, -94, 8, 22, 12, toColor('#FFE5AA'), 6);
        this.box(root, 97, 10, 14, 16, toColor('#FFD49B'), 6);
        for (const x of [-66, 66]) {
          this.disc(root, x, 44, 49, 49, toColor('#253342'), 6);
          this.disc(root, x, 44, 24, 24, toColor('#C9D2D5'), 7);
        }
      } else if (scene === 'bike') {
        for (const x of [-78, 78]) {
          this.disc(root, x, 43, 70, 70, toColor('#263444'), 3);
          this.disc(root, x, 43, 47, 47, toColor('#C8D5D8'), 4);
          this.disc(root, x, 43, 34, 34, toColor(c.sky), 5);
        }
        this.path(root, 'bike-frame', 'M-78-43L-28 12L27-43H15L-27-3L-66-43ZM-18 20H35L82-43H70L30 8H-18Z', 0, 0, '#F9A54D', 1, 6);
        this.box(root, 7, -30, 70, 17, toColor('#293B48'), 7);
        this.box(root, -13, -5, 63, 35, toColor('#E97143'), 6);
        this.path(root, 'rider', 'M-9 2L-27 45L5 68L28 36L13 28L3 43L-8 35L8 8Z', 0, -45, '#4B91B3', 1, 8);
        this.disc(root, 6, -87, 45, 45, toColor('#FFD177'), 9);
        this.box(root, 15, -88, 32, 15, toColor('#31434F'), 10);
      } else {
        this.box(root, -55, -19, 111, 48, toColor('#E78459'), 4);
        for (const x of [-90, -23]) this.disc(root, x, 5, 25, 25, toColor('#263444'), 5);
        this.disc(root, 77, -4, 58, 68, toColor('#FFF8E7'), 6);
        this.disc(root, 93, -30, 39, 39, toColor('#FFF8E7'), 7);
        this.box(root, 115, -27, 20, 12, toColor('#EDB44C'), 8);
      }
      return;
    }
    if (scene === 'penguin') {
      this.disc(root, 0, 5, 108, 140, toColor('#1E2D43'), 3);
      this.disc(root, 0, 20, 73, 95, toColor('#FFF8ED'), 4);
      this.disc(root, 0, -67, 94, 90, toColor('#192A40'), 5);
      this.disc(root, 0, -61, 77, 60, toColor('#FFF8ED'), 6);
      for (const x of [-21, 21]) {
        this.disc(root, x, -67, 21, 26, toColor('#5394D8'), 7);
        this.disc(root, x, -66, 10, 15, toColor('#162539'), 8);
      }
      this.path(root, 'beak', 'M-14 5H14L0-10Z', 0, -40, '#FFB542', 1, 9);
      this.disc(root, -27, 78, 42, 18, toColor('#F7AE42'), 5);
      this.disc(root, 27, 78, 42, 18, toColor('#F7AE42'), 5);
      return;
    }
    if (scene === 'ninja' || scene === 'merger') {
      this.fruit(root, -74, 35, 100, '#EE6465');
      this.fruit(root, 43, -8, 117, '#F8B246');
      this.fruit(root, 115, 61, 66, '#A4CE68');
      if (scene === 'ninja') this.path(root, 'slash', 'M-138-78Q-4-37 119 111L143 99Q19-61-126-91Z', 0, 0, '#ECFFF1', 1, 8);
      return;
    }
    if (scene === 'tua') {
      this.disc(root, 0, 49, 95, 106, toColor('#D2AAEE'), 3);
      this.disc(root, 0, -37, 128, 119, toColor('#DCC0F3'), 5);
      for (const x of [-36, 36]) {
        this.disc(root, x, -103, 33, 86, toColor('#DCC0F3'), 3);
        this.disc(root, x, -104, 14, 55, toColor('#F7C7D9'), 4);
      }
      this.disc(root, 0, -13, 75, 51, toColor('#FFF2E4'), 6);
      for (const x of [-25, 25]) {
        this.disc(root, x, -43, 13, 19, toColor('#382B51'), 7);
        this.disc(root, x - 2, -47, 4, 6, [1, 1, 1, 1], 8);
      }
      this.disc(root, 0, -19, 15, 10, toColor('#A06C94'), 8);
      this.disc(root, -57, 37, 31, 67, toColor('#B996DF'), 2);
      this.disc(root, 57, 37, 31, 67, toColor('#B996DF'), 2);
      this.disc(root, -29, 101, 51, 25, toColor('#B996DF'), 4);
      this.disc(root, 29, 101, 51, 25, toColor('#B996DF'), 4);
      return;
    }
    if (scene === 'chameleon') {
      this.path(root, 'chameleon-step', 'M-140-60H-55V-30H-140ZM-15-15H60V15H-15ZM100 35H156V65H100Z', 0, 0, '#F2C950', 1, 2);
      this.disc(root, 8, -26, 110, 59, toColor('#ED67AD'), 3);
      this.disc(root, 67, -39, 65, 65, toColor('#F6D856'), 4);
      this.disc(root, 81, -55, 30, 30, toColor('#FFF8E8'), 5);
      this.disc(root, 85, -54, 11, 13, toColor('#3E3756'), 6);
      this.path(
        root,
        'tail',
        'M-40 42Q-123 97-111 18Q-100-20-67 10Q-50 40-85 43L-84 29Q-68 29-78 18Q-94 6-97 23Q-105 74-47 29Z',
        0,
        0,
        '#ED67AD',
        1,
        4
      );
      return;
    }
    // Tiles, territory games and the catalog fallback share a bright toy-board illustration.
    const colors = ['#F3B655', '#A98ADB', '#7DC4AB', '#ED8292', '#73BBD6', '#E7D365'];
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 3; col++) {
        const x = (col - 1) * 87,
          y = (row - 0.5) * 87;
        this.box(root, x + 4, y + 8, 76, 76, toColor('#000000', 0.16));
        this.box(root, x, y, 76, 76, toColor(colors[row * 3 + col]!));
        this.path(root, 'diamond', DIAMOND, x, y, '#FFFFFF', 0.65, 4);
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
