// Playtura's scoreboard and game controls drawn by the engine, as a GameView `overlay`: the same panel,
// columns, start/stop button and trophy/share buttons as ScoreBoardContainer and GameControlButton, but
// rendered in Rust with the scene, so React re-renders nothing while a game runs. Overlay space is in
// points from the view's top-left, y up (screen y is negated), z toward the viewer.
import { type Color, type Entity, extrude, type Font, loadFont, measureText, type Model, Path, World } from '@nayan-ui/engine';
import { PLAY_PATH, SHARE_PATH, TROPHY_PATH } from '../../helpers/IconPaths';
import type { GameTheme } from '../../services/ThemeService';
import { getGameDimensions } from '../../services/UtilsService';
import { cardBackdropMesh } from './EngineBackdrop';
import { fitControlSubtitle } from './EngineControlText';
import { cacheGameAsset, createGameMesh as createShape } from './EngineMeshes';
import { gameWidthFor, toColor } from './EngineUtils';

const CAPACITY = 900;
const BOARD_PAD_V = 14;
const BOARD_RADIUS = 18;
// Font sizes and letter spacing in points, as ScoreBoardContainer / GameControlButton / GameOverModal
const LABEL_SIZE = 12;
const VALUE_SIZE = 24;
const LABEL_SPACING = 1.2;
const BOARD_HEIGHT = BOARD_PAD_V * 2 + 12 + 4 + 24;
const ROW_PAD_V = 20;
const ROW_PAD_H = 16;
const ROW_GAP = 20;
const MAIN_HEIGHT = 60;
const ICON_SIZE = 56;
const BUTTON_TEXT = 16;
const BUTTON_SUBTEXT = 10;
const PULSE = 1.05;
const PRESSED = 0.95;
// The game-over card (GameOverModal's layout)
const Z_OVER = 40;
const CARD_PAD = 20;
const TROPHY = 48;
const TITLE_SIZE = 28;
const MESSAGE_SIZE = 14;
const SCORE_LABEL_SIZE = 13;
const SCORE_SIZE = 44;
const PROMPT_SIZE = 15;
const PLAY_SIZE = 17;
const SHARE_SIZE = 16;
const RESULT_BUTTON = 52;
const COUNT_DELAY = 0.2;
const COUNT_TIME = 0.9;
const SHARE_PROMPT = 'Share your goals with your family and friends and challenge them to beat your score!';

/** A scoreboard column: text (optionally colored), or `lives` drawn as hearts. */
export type HudColumn = { label: string; value: string; color?: string; valueColor?: string; lives?: { count: number; max: number } };

/** Top edge of the scoreboard; `offset` is the height of the host app's header, 0 when there is none. */
const getScoreBoardTop = (offset = 0) => (offset > 0 ? offset + 15 : 15);
/** Insets for a React touch surface over the scene, leaving the native HUD's controls reachable. */
const getSceneInputInsets = (offset = 0) => ({
  top: getScoreBoardTop(offset) + BOARD_HEIGHT + 10,
  bottom: ROW_PAD_V + MAIN_HEIGHT + 10 + 5
});

/** The usual columns. */
export const scoreColumn = (score: number, label = 'SCORE', format: (n: number) => string = (n) => n.toLocaleString()): HudColumn => ({
  label,
  value: format(score)
});
export const livesColumn = (count: number, max: number, label = 'LIVES'): HudColumn => ({ label, value: `${count}/${max}`, lives: { count, max } });
export const textColumn = (label: string, value: string | number, color?: string): HudColumn => ({ label, value: String(value), color });

const HEART_PATH =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
const HEART_SIZE = 20;
const HEART_GAP = 2;
const HEART_ON = '#E53935';
const HEART_OFF = '#2B2B2B';
type HudButton = 'main' | 'leaderboard' | 'share' | 'choice';
type HudActions = { onStart: () => void; onStop: () => void; onShare?: () => void; onShowLeaderboard?: () => void };

type Rect = { id: HudButton; x: number; y: number; w: number; h: number; root: Entity; action?: () => void };

export type GameOverCard = {
  title: string;
  message?: string;
  scoreLabel: string;
  score: number;
  formatter?: (score: number) => string;
  buttonText: string;
  onPlayAgain: () => void;
  onShare?: () => void;
};
export interface HudChoice {
  id: string;
  label: string;
  selected?: boolean;
  onPress: () => void;
}

/** Events coalesce until the next engine frame; consuming them never triggers a React render. */
export interface HudFeedback {
  flash?: boolean;
  message?: string;
}

type Over = {
  card: GameOverCard;
  root: Entity;
  scoreParent: Entity;
  scoreY: number;
  scoreText: string;
  scoreEntity: Entity | null;
  elapsed: number;
  buttons: Rect[];
  /** Where the banner ad goes, in points from the view's top. */
  bannerTop: number;
  bannerWidth: number;
};

const meshes = new Map<string, Model>();
const cached = (key: string, build: () => Model) => {
  let m = meshes.get(key);
  if (!m) {
    m = cacheGameAsset('shared/EngineHud:' + key, build);
    meshes.set(key, m);
  }
  return m;
};
/** A flat rounded rectangle centred on the origin (sizes are rounded so few meshes are made). */
const panelMesh = (w: number, h: number, r: number) => {
  const [rw, rh] = [Math.round(w), Math.round(h)];
  return cached(`hud-panel:${rw}:${rh}:${r}`, () =>
    createShape(extrude(new Path().addRoundedRect(-rw / 2, -rh / 2, rw, rh, Math.min(r, rw / 2, rh / 2)), { depth: 0 }), { center: false })
  );
};
/** The outline of panelMesh(w, h, r), `bw` thick (a border, so translucent faces aren't tinted by it). */
const ringMesh = (w: number, h: number, r: number, bw: number) => {
  const [rw, rh] = [Math.round(w), Math.round(h)];
  return cached(`hud-ring:${rw}:${rh}:${r}:${bw}`, () => {
    const outer = Math.min(r, rw / 2, rh / 2);
    const path = new Path()
      .addRoundedRect(-rw / 2, -rh / 2, rw, rh, outer)
      .addRoundedRect(-rw / 2 + bw, -rh / 2 + bw, rw - bw * 2, rh - bw * 2, Math.max(0, outer - bw));
    return createShape(extrude(path, { depth: 0, fillRule: 'evenodd' }), { center: false });
  });
};
/** The RN icons' own outlines (Icons.tsx), flat, one unit across at their widest. */
const iconMesh = (key: string, d: string) => cached(`hud-icon:${key}`, () => createShape(extrude(Path.fromSVG(d), { depth: 0 }), { fit: 1 }));
const trophyMesh = () => iconMesh('trophy', TROPHY_PATH);
const shareMesh = () => iconMesh('share', SHARE_PATH);
const playMesh = () => iconMesh('play', PLAY_PATH);
const heartMesh = () => iconMesh('heart', HEART_PATH);
// How much of each icon's 512 box its outline fills, so `size` matches the RN icon's size.
const TROPHY_INK = 448 / 512;
const SHARE_INK = 415 / 512;
const PLAY_INK = 332 / 512;

type Fonts = { semi: Font; regular: Font };
type Weight = keyof Fonts;
let fonts: Fonts | null = null;
let fontsLoading: Promise<Fonts> | null = null;
// Glyphs share the engine's 4,096 app-wide mesh ids with models. Prewarm common HUD characters in
// one weight; the font builds other Unicode symbols only when a label actually needs them.
const HUD_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,:!?'%/+-·×÷…";
/** Inter SemiBold for all HUD text, flat (depth 0) like normal text: loaded once per app. */
export function loadHudFonts(): Promise<Fonts> {
  fontsLoading ??= loadFont(require('../../assets/fonts/Inter-SemiBold.ttf'), { depth: 0, chars: HUD_CHARS }).then(
    (semi) => (fonts = { semi, regular: semi })
  );
  return fontsLoading;
}

/** A line's width in points at font size `size`, with `spacing` points between letters. */
function textWidth(text: string, size: number, spacing = 0, weight: Weight = 'semi'): number {
  const font = fonts?.[weight];
  if (!font) return 0;
  return measureText(font, text, { letterSpacing: spacing / size }) * size;
}

/** Words broken into lines at most `max` points wide. */
function wrap(text: string, size: number, max: number, weight: Weight): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && textWidth(next, size, 0, weight) > max) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

const columnKey = (c: HudColumn) =>
  `${c.value}\u0000${c.color ?? ''}\u0000${c.valueColor ?? ''}\u0000${c.lives ? `${c.lives.count}/${c.lives.max}` : ''}`;

/** Text centred on (x, y) in its parent at font size `size` (points), `spacing` points between letters. */
function spawnText(
  world: World,
  parent: Entity,
  text: string,
  x: number,
  y: number,
  size: number,
  color: Color,
  spacing = 0,
  weight: Weight = 'semi',
  tabular = false
): Entity {
  return world.spawn({
    text,
    font: fonts![weight],
    parent,
    position: [x, y, 2],
    scale: size,
    color,
    letterSpacing: spacing / size,
    tabular,
    pickable: false
  });
}

/** The engine-drawn scoreboard and controls. Feed it state; pass `world` as GameView's `overlay`. */
export class EngineHud {
  readonly world: World;
  private theme: GameTheme;
  private size = { width: 0, height: 0, offset: 0 };
  private columns: HudColumn[] = [];
  private playing = false;
  private subtext = 'Begin playing!';
  private actions: HudActions = { onStart: () => {}, onStop: () => {} };
  private board: Entity | null = null;
  private controls: Entity | null = null;
  private values: { entity: Entity; key: string; x: number; y: number }[] = [];
  private buttons: Rect[] = [];
  private pressed: Rect | null = null;
  private over: Over | null = null;
  private overReserve = 0;
  private disposed = false;
  private feedback: { root: Entity; flash: Entity | null; message: Entity | null; text: string } | null = null;

  private waiting: GameOverCard | null = null;
  private layers = new Map<string, Entity>();
  private choices: HudChoice[] = [];
  private choiceRoot: Entity | null = null;
  private choiceButtons: Rect[] = [];
  private choicePage = 0;

  get ready() {
    return !this.disposed && !!fonts && this.size.width > 0;
  }
  get viewport() {
    return this.size;
  }
  layer(key: string): Entity {
    let root = this.layers.get(key);
    if (root === undefined) {
      root = this.world.spawn({ mesh: 'none', position: [0, 0, 5], pickable: false });
      this.layers.set(key, root);
    }
    return root;
  }
  clearLayer(key: string) {
    const root = this.layers.get(key);
    if (root !== undefined) this.world.despawn(root);
    this.layers.delete(key);
  }
  text(parent: Entity, text: string, x: number, y: number, size: number, color: Color): Entity {
    return spawnText(this.world, parent, text, x, y, size, color);
  }
  rectangle(parent: Entity, x: number, y: number, width: number, height: number, color: Color, z = 0): Entity {
    return this.world.spawn({ mesh: panelMesh(1, 1, 0), parent, position: [x, y, z], scale: [width, height, 1], color, pickable: false });
  }
  setChoices(choices: HudChoice[]) {
    const changed =
      choices.length !== this.choices.length ||
      choices.some((item, i) => {
        const previous = this.choices[i];
        return item.id !== previous?.id || item.label !== previous.label || item.selected !== previous.selected;
      });
    this.choices = choices;
    if (changed) this.buildChoices();
  }
  private buildChoices() {
    if (this.choiceRoot !== null) this.world.despawn(this.choiceRoot);
    this.choiceRoot = null;
    this.choiceButtons = [];
    if (!this.ready || !this.choices.length) return;
    const { width, height } = this.size;
    const pageSize = 3;
    const pages = Math.ceil(this.choices.length / pageSize);
    this.choicePage = Math.min(this.choicePage, pages - 1);
    const root = this.world.spawn({ mesh: 'none', position: [0, 0, 6], pickable: false });
    this.choiceRoot = root;
    const w = Math.min(width - 24, 500),
      gap = 6,
      cell = (w - gap * 4) / 5;
    const cy = height - getSceneInputInsets().bottom - 22;
    const draw = (label: string, index: number, action: () => void, selected = false) => {
      const x = (width - w) / 2 + cell / 2 + index * (cell + gap);
      const panel = this.panel(root, x, cy, cell, 36, 12, selected ? this.theme.SOLID : this.theme.SURFACE);
      spawnText(
        this.world,
        panel,
        label,
        0,
        0,
        Math.min(12, (cell - 8) / Math.max(1, label.length) / 0.65),
        toColor(selected ? this.theme.ON_SOLID : this.theme.TEXT)
      );
      this.choiceButtons.push({ id: 'choice', x: x - cell / 2, y: cy - 18, w: cell, h: 36, root: panel, action });
    };
    draw('<', 0, () => {
      this.choicePage = (this.choicePage + pages - 1) % pages;
      this.buildChoices();
    });
    this.choices
      .slice(this.choicePage * pageSize, (this.choicePage + 1) * pageSize)
      .forEach((item, i) => draw(item.label, i + 1, () => this.choices.find((choice) => choice.id === item.id)?.onPress(), item.selected));
    draw('>', 4, () => {
      this.choicePage = (this.choicePage + 1) % pages;
      this.buildChoices();
    });
  }

  constructor(theme: GameTheme, capacity = CAPACITY) {
    this.world = new World(capacity);
    this.theme = theme;
    // Everything is drawn once the fonts are in (immediately after the first visit)
    loadHudFonts()
      .then(() => {
        if (this.disposed) return;
        this.buildBoard();
        this.buildControls();
        this.buildChoices();
        if (this.waiting) this.buildOver(this.waiting, true);
        this.waiting = null;
      })
      .catch((error: unknown) => console.error(`EngineHud: ${error instanceof Error ? error.message : String(error)}`));
  }

  setActions(actions: HudActions) {
    const changed = !!actions.onShare !== !!this.actions.onShare || !!actions.onShowLeaderboard !== !!this.actions.onShowLeaderboard;
    this.actions = actions;
    if (changed) this.buildControls();
  }

  layout(width: number, height: number, offset: number) {
    if (width === this.size.width && height === this.size.height && offset === this.size.offset) return;
    this.size = { width, height, offset };
    this.layoutFeedback();
    this.buildBoard();
    this.buildControls();
    this.buildChoices();
    if (this.over) this.buildOver(this.over.card, false);
  }

  setTheme(theme: GameTheme) {
    if (theme === this.theme) return;
    this.theme = theme;
    this.clearFeedback();
    this.buildBoard();
    this.buildControls();
    this.buildChoices();
    if (this.over) this.buildOver(this.over.card, false);
  }

  /** The scoreboard's columns; only values that changed are redrawn. */
  setColumns(columns: HudColumn[]) {
    const sameLabels = columns.length === this.columns.length && columns.every((c, i) => c.label === this.columns[i]!.label);
    this.columns = columns;
    if (!sameLabels || this.values.length !== columns.length) return this.buildBoard();
    columns.forEach((c, i) => {
      const v = this.values[i]!;
      const key = columnKey(c);
      if (v.key === key || this.disposed || this.board === null) return;
      this.world.despawn(v.entity);
      v.entity = this.spawnValue(this.board, c, v.x, v.y);
      v.key = key;
    });
  }

  setPlaying(playing: boolean, subtext = this.subtext) {
    if (playing === this.playing && subtext === this.subtext) return;
    this.playing = playing;
    this.subtext = subtext;
    this.buildControls();
  }

  update(dt: number, feedback?: HudFeedback) {
    if (this.disposed) return;
    if (feedback) this.showFeedback(feedback);
    const o = this.over;
    if (o && o.elapsed < COUNT_DELAY + COUNT_TIME) {
      o.elapsed += dt;
      const t = Math.min(1, Math.max(0, (o.elapsed - COUNT_DELAY) / COUNT_TIME));
      this.setOverScore(Math.round(o.card.score * (1 - (1 - t) ** 3)));
    }
    this.world.update(dt);
  }

  private showFeedback(feedback: HudFeedback) {
    if (!this.size.width || !fonts) return;
    if (!this.over && !this.waiting && (feedback.flash || feedback.message)) {
      const effects = (this.feedback ??= {
        root: this.world.spawn({ mesh: 'none', position: [0, 0, Z_OVER - 5], pickable: false }),
        flash: null,
        message: null,
        text: ''
      });
      if (feedback.flash) {
        effects.flash ??= this.world.spawn({ mesh: panelMesh(1, 1, 0), parent: effects.root, pickable: false });
        const color = toColor(this.theme.DANGER, 0.6);
        this.world.stopAnimation(effects.flash);
        this.world.set(effects.flash, { color });
        this.world.animate(effects.flash, { color: [color[0], color[1], color[2], 0] }, { duration: 0.4 });
      }
      if (feedback.message) {
        if (effects.text !== feedback.message && effects.message !== null) {
          this.world.despawn(effects.message);
          effects.message = null;
        }
        const color = toColor(this.theme.SCORE_HIGHLIGHT);
        effects.text = feedback.message;
        effects.message ??= spawnText(this.world, effects.root, effects.text, 0, 0, 30, color);
        this.world.stopAnimation(effects.message);
        this.world.set(effects.message, { color });
        this.world.animate(effects.message, { color: [color[0], color[1], color[2], 0] }, { duration: 0.9 });
      }
      this.layoutFeedback();
    }
    feedback.flash = false;
    feedback.message = undefined;
  }

  private layoutFeedback() {
    const effects = this.feedback;
    if (!effects) return;
    const { width, height, offset } = this.size;
    if (effects.flash !== null) this.world.set(effects.flash, { position: [width / 2, -height / 2, 0], scale: [width, height, 1] });
    if (effects.message !== null) this.world.set(effects.message, { position: [width / 2, -(getScoreBoardTop(offset) + BOARD_HEIGHT + 14 + 15), 2] });
  }

  private clearFeedback() {
    if (this.feedback && !this.disposed) this.world.despawn(this.feedback.root);
    this.feedback = null;
  }

  /** Shows the game-over card over everything (it takes every touch until hidden). */
  showGameOver(card: GameOverCard) {
    this.clearFeedback();
    const o = this.over;
    if (o && o.card.title === card.title && o.card.message === card.message && o.card.score === card.score && !!o.card.onShare === !!card.onShare) {
      o.card = card; // fresh callbacks only
      return;
    }
    if (!fonts) this.waiting = card;
    else this.buildOver(card, true);
  }

  hideGameOver() {
    this.waiting = null;
    if (!this.over) return;
    if (!this.disposed) this.world.despawn(this.over.root);
    if (this.pressed && this.over.buttons.includes(this.pressed)) this.pressed = null;
    this.over = null;
  }

  /** Where an RN banner ad sits under the card's buttons (null: no card). */
  get gameOverBanner(): { top: number; width: number } | null {
    return this.over ? { top: this.over.bannerTop, width: this.over.bannerWidth } : null;
  }

  /** Room left in the card for the banner ad (its measured height), in points. */
  setGameOverReserve(height: number) {
    if (Math.abs(height - this.overReserve) < 1) return;
    this.overReserve = height;
    if (this.over) this.buildOver(this.over.card, false);
  }

  /** GameView's onOverlayTouch: true when a button took the touch. */
  touch = (phase: 'start' | 'move' | 'end' | 'cancel', x: number, y: number): boolean => {
    if (phase === 'start') {
      const list = this.over ? this.over.buttons : [...this.buttons, ...this.choiceButtons];
      const hit = list.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
      if (!hit) return this.over !== null; // the card is modal
      this.pressed = hit;
      this.world.animate(hit.root, { scale: PRESSED }, { duration: 0.08 });
      return true;
    }
    if (phase === 'move' || !this.pressed) return true;
    const b = this.pressed;
    this.pressed = null;
    const inside = x >= b.x - 10 && x <= b.x + b.w + 10 && y >= b.y - 10 && y <= b.y + b.h + 10;
    this.release(b);
    if (phase === 'end' && inside) {
      if (b.action) b.action();
      else this.fire(b.id);
    }
    return true;
  };

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.world.dispose();
  }

  private release(b: Rect) {
    if (b.id === 'main' && !this.playing && !b.action) this.pulse(b.root);
    else this.world.animate(b.root, { scale: 1 }, { duration: 0.12 });
  }

  private pulse(root: Entity) {
    this.world.set(root, { scale: 1 });
    this.world.animate(root, { scale: PULSE }, { duration: 1, repeat: 'forever', yoyo: true });
  }

  private fire(id: HudButton) {
    if (id === 'main') {
      if (this.playing) this.clearFeedback();
      (this.playing ? this.actions.onStop : this.actions.onStart)();
    } else if (id === 'share') this.actions.onShare?.();
    else this.actions.onShowLeaderboard?.();
  }

  /** A themed button panel (border behind the face) under a root at its centre. */
  private panel(
    parent: Entity | null,
    cx: number,
    cy: number,
    w: number,
    h: number,
    r: number,
    face = this.theme.SURFACE,
    border = this.theme.BORDER
  ): Entity {
    const t = this.theme;
    const root = this.world.spawn({ mesh: 'none', ...(parent !== null && { parent }), position: [cx, -cy, 0], pickable: false });
    const bw = t.BORDER_WIDTH ?? 0;
    if (bw > 0) this.world.spawn({ mesh: ringMesh(w, h, r, bw), parent: root, position: [0, 0, 0.5], color: toColor(border), pickable: false });
    this.world.spawn({ mesh: panelMesh(w - bw * 2, h - bw * 2, r - bw), parent: root, position: [0, 0, 0], color: toColor(face), pickable: false });
    return root;
  }

  private setOverScore(value: number) {
    const o = this.over;
    if (!o) return;
    const text = (o.card.formatter ?? ((n: number) => n.toLocaleString()))(value);
    if (text === o.scoreText && o.scoreEntity !== null) return;
    if (o.scoreEntity !== null) this.world.despawn(o.scoreEntity);
    o.scoreText = text;
    o.scoreEntity = spawnText(this.world, o.scoreParent, text, 0, o.scoreY, SCORE_SIZE, toColor(this.theme.SCORE_HIGHLIGHT), 0, 'semi', true);
  }

  /** The card, laid out top to bottom as GameOverModal; `animate` plays its entrance. */
  private buildOver(card: GameOverCard, animate: boolean) {
    const counted = this.over && !animate ? this.over.elapsed : 0;
    this.hideGameOver();
    const { width, height } = this.size;
    if (this.disposed || !width || !fonts) return;
    const t = this.theme;
    const w = Math.min(getGameDimensions().width, width - 30);
    const inner = w - CARD_PAD * 2;
    const message = card.message ? wrap(card.message, MESSAGE_SIZE, inner, 'regular') : [];
    const prompt = card.onShare ? wrap(SHARE_PROMPT, PROMPT_SIZE, inner + 30, 'regular') : [];
    // Heights, top to bottom
    const titleH = 34;
    const scoreH = 16 + 16 + 4 + 52 + 16;
    const h =
      CARD_PAD +
      TROPHY +
      8 +
      titleH +
      (message.length ? 4 + message.length * 20 + 16 : 20) +
      scoreH +
      24 +
      (prompt.length ? prompt.length * 25 + 5 + 12 : 0) +
      RESULT_BUTTON +
      (this.overReserve > 0 ? 12 + this.overReserve : 0) +
      CARD_PAD;
    const top = Math.max(10, (height - h) / 2);
    const cx = width / 2;

    const root = this.world.spawn({ mesh: 'none', position: [0, 0, Z_OVER], pickable: false });
    const backdrop = this.world.spawn({
      mesh: panelMesh(width, height, 0),
      parent: root,
      position: [width / 2, -height / 2, 0],
      color: animate ? toColor(t.OVERLAY, 0) : toColor(t.OVERLAY),
      pickable: false
    });
    // The card: the game background pattern (as BackdropCard), cut to its rounded corners
    const box = this.world.spawn({ mesh: 'none', parent: root, position: [cx, -(top + h / 2), 2], pickable: false });
    this.world.spawn({
      mesh: cardBackdropMesh(t, w, h, 16),
      parent: box,
      position: [-Math.round(w) / 2, Math.round(h) / 2, 0],
      color: [1, 1, 1, 1],
      pickable: false
    });
    // Children of the card are placed from its centre: screen y below the card's top -> local y
    const ly = (y: number) => h / 2 - y;
    const group = (y: number) => this.world.spawn({ mesh: 'none', parent: box, position: [0, ly(y), 1], pickable: false });
    let y = CARD_PAD;

    const trophy = group(y + TROPHY / 2);
    this.world.spawn({ mesh: trophyMesh(), parent: trophy, position: [0, 0, 0], scale: TROPHY * TROPHY_INK, color: [1, 1, 1, 1], pickable: false });
    y += TROPHY + 8;
    spawnText(this.world, group(y + titleH / 2), card.title, 0, 0, TITLE_SIZE, toColor(t.TEXT), 1);
    y += titleH;
    if (message.length) {
      y += 4;
      for (const line of message) {
        spawnText(this.world, group(y + 10), line, 0, 0, MESSAGE_SIZE, toColor(t.TEXT_SUBTLE), 0, 'regular');
        y += 20;
      }
      y += 16;
    } else y += 20;

    const scoreAt = ly(y + scoreH / 2);
    const scoreGroup = group(y + scoreH / 2);
    const sw = Math.max(200, Math.min(inner, 260));
    const scorePanel = this.panel(scoreGroup, 0, 0, sw, scoreH, 16);
    spawnText(this.world, scorePanel, card.scoreLabel.toUpperCase(), 0, scoreH / 2 - 16 - 8, SCORE_LABEL_SIZE, toColor(t.TEXT_SUBTLE), 1, 'semi');
    const scoreY = -scoreH / 2 + 16 + 26;
    y += scoreH + 24;

    const actionsAt = ly(y);
    const actions = group(y);
    let ay = 0; // screen points below the actions' top
    for (const line of prompt) {
      spawnText(this.world, actions, line, 0, -(ay + 12.5), PROMPT_SIZE, toColor(t.TEXT_SUBTLE), 0, 'regular');
      ay += 25;
    }
    if (prompt.length) ay += 5 + 12;
    const buttons: Rect[] = [];
    const rowY = ay + RESULT_BUTTON / 2;
    const left = -inner / 2;
    const shareW = card.onShare ? ((inner - 10) * 2) / 5 : 0;
    const playW = card.onShare ? inner - 10 - shareW : inner;
    const addButton = (
      x: number,
      bw: number,
      face: string,
      border: string,
      label: string,
      size: number,
      weight: Weight,
      color: Color,
      mesh: Model,
      ink: number,
      action: () => void
    ) => {
      const b = this.panel(actions, x + bw / 2, rowY, bw, RESULT_BUTTON, 26, face, border);
      // Icon (18) + gap (8) + label, centred as a row
      const fittedSize = Math.min(size, (size * (bw - 44)) / Math.max(1, textWidth(label, size, 0.5, weight)));
      const textW = textWidth(label, fittedSize, 0.5, weight);
      const iconX = -(textW + 26) / 2 + 9;
      this.world.spawn({ mesh, parent: b, position: [iconX, 0, 2], scale: 18 * ink, color, pickable: false });
      spawnText(this.world, b, label, iconX + 9 + 8 + textW / 2, 0, fittedSize, color, 0.5, weight);
      // Screen rect: the actions group's top is at screen `top + y`
      buttons.push({ id: 'main', x: cx + x, y: top + y + rowY - RESULT_BUTTON / 2, w: bw, h: RESULT_BUTTON, root: b, action });
    };
    if (card.onShare)
      addButton(left, shareW, t.SURFACE, t.BORDER, 'Share', SHARE_SIZE, 'semi', toColor(t.TEXT), shareMesh(), SHARE_INK, () =>
        this.over?.card.onShare?.()
      );
    addButton(
      left + (card.onShare ? shareW + 10 : 0),
      playW,
      t.SOLID,
      t.SOLID,
      card.buttonText,
      PLAY_SIZE,
      'semi',
      toColor(t.ON_SOLID),
      playMesh(),
      PLAY_INK,
      () => this.over?.card.onPlayAgain()
    );
    ay += RESULT_BUTTON;

    this.over = {
      card,
      root,
      scoreParent: scorePanel,
      scoreY,
      scoreText: '',
      scoreEntity: null,
      elapsed: counted,
      buttons,
      bannerTop: top + y + ay + 12,
      bannerWidth: inner
    };
    this.setOverScore(animate ? 0 : card.score);

    if (!animate) return;
    // GameOverModal's entrance: fade the backdrop, spring the card, punch the trophy, lift score then actions
    this.world.animate(backdrop, { color: toColor(t.OVERLAY) }, { duration: 0.16 });
    this.world.set(box, { scale: 0.85 });
    this.world.animate(box, { scale: 1 }, { spring: 'bouncy' });
    this.world.set(trophy, { scale: 0 });
    this.world.animate(trophy, [{ scale: 1.18 }, { scale: 1 }], { delay: 0.09, duration: 0.35, easing: 'back' });
    for (const [g, at, delay] of [
      [scoreGroup, scoreAt, 0.2],
      [actions, actionsAt, 0.33]
    ] as const) {
      this.world.set(g, { position: [0, at - 18, 1] });
      this.world.animate(g, { position: [0, at, 1] }, { delay, spring: true });
    }
  }

  private buildBoard() {
    if (this.disposed) return;
    if (this.board !== null) this.world.despawn(this.board);
    this.board = null;
    this.values = [];
    const { width, offset } = this.size;
    if (!width || !fonts) return;
    const w = gameWidthFor(width);
    const top = getScoreBoardTop(offset);
    const board = this.panel(null, width / 2, top + BOARD_HEIGHT / 2, w, BOARD_HEIGHT, BOARD_RADIUS);
    this.board = board;
    const n = this.columns.length;
    const labelY = BOARD_HEIGHT / 2 - BOARD_PAD_V - 6;
    const valueY = -BOARD_HEIGHT / 2 + BOARD_PAD_V + 12;
    const label = toColor(this.theme.LABEL);
    this.columns.forEach((c, i) => {
      const x = -w / 2 + (w * (i + 0.5)) / n;
      spawnText(this.world, board, c.label, x, labelY, LABEL_SIZE, c.color ? toColor(c.color) : label, LABEL_SPACING, 'semi');
      this.values.push({ entity: this.spawnValue(board, c, x, valueY), key: columnKey(c), x, y: valueY });
    });
  }

  /** The same primary control for keyboard input, including the results card. */
  activatePrimary() {
    if (!this.ready) return;
    if (this.over) this.over.card.onPlayAgain();
    else this.fire('main');
  }

  /** A column's value: its text, or a row of hearts. */
  private spawnValue(board: Entity, c: HudColumn, x: number, y: number): Entity {
    if (!c.lives)
      return spawnText(this.world, board, c.value, x, y, VALUE_SIZE, toColor(c.valueColor ?? c.color ?? this.theme.TEXT), 0, 'semi', true);
    const { count, max } = c.lives;
    const row = this.world.spawn({ mesh: 'none', parent: board, position: [x, y, 2], pickable: false });
    const columnWidth = gameWidthFor(this.size.width) / this.columns.length - 12;
    const heartSize = Math.min(HEART_SIZE, Math.max(6, (columnWidth - (max - 1) * HEART_GAP) / Math.max(1, max)));
    const step = heartSize + HEART_GAP;
    for (let i = 0; i < max; i++) {
      const hx = (i - (max - 1) / 2) * step;
      this.world.spawn({
        mesh: heartMesh(),
        parent: row,
        position: [hx, 0, 0],
        scale: heartSize,
        color: toColor(i < count ? HEART_ON : HEART_OFF),
        pickable: false
      });
    }
    return row;
  }

  private buildControls() {
    if (this.disposed) return;
    if (this.controls !== null) this.world.despawn(this.controls);
    this.controls = null;
    this.buttons = [];
    this.pressed = null;
    const { width, height } = this.size;
    if (!width || !fonts) return;
    const rowW = Math.min(getGameDimensions().width, width);
    const left = (width - rowW) / 2 + ROW_PAD_H;
    const right = (width + rowW) / 2 - ROW_PAD_H;
    const cy = height - 5 - ROW_PAD_V - MAIN_HEIGHT / 2;
    const controls = this.world.spawn({ mesh: 'none', position: [0, 0, 10], pickable: false });
    this.controls = controls;
    const text = toColor(this.theme.TEXT);
    let mainLeft = left;
    let mainRight = right;
    const icon = (id: HudButton, x: number, mesh: Model, ink: number) => {
      const root = this.panel(controls, x, cy, ICON_SIZE, ICON_SIZE, ICON_SIZE / 2);
      this.world.spawn({ mesh, parent: root, position: [0, 0, 2], scale: 24 * ink, color: text, pickable: false });
      this.buttons.push({ id, x: x - ICON_SIZE / 2, y: cy - ICON_SIZE / 2, w: ICON_SIZE, h: ICON_SIZE, root });
    };
    if (this.actions.onShowLeaderboard) {
      icon('leaderboard', left + ICON_SIZE / 2, trophyMesh(), TROPHY_INK);
      mainLeft += ICON_SIZE + ROW_GAP;
    }
    if (this.actions.onShare) {
      icon('share', right - ICON_SIZE / 2, shareMesh(), SHARE_INK);
      mainRight -= ICON_SIZE + ROW_GAP;
    }
    const mw = mainRight - mainLeft;
    const mx = (mainLeft + mainRight) / 2;
    const main = this.panel(controls, mx, cy, mw, MAIN_HEIGHT, 30);
    spawnText(this.world, main, this.playing ? 'STOP GAME' : 'START GAME', 0, 7, BUTTON_TEXT, text, 1);
    const subtitle = fitControlSubtitle(this.playing ? 'Stop current game' : this.subtext, Math.max(0, mw - 24), (value) =>
      textWidth(value, BUTTON_SUBTEXT, 0.5)
    );
    spawnText(this.world, main, subtitle, 0, -12, BUTTON_SUBTEXT, toColor(this.theme.LABEL), 0.5, 'semi');
    this.buttons.push({ id: 'main', x: mainLeft, y: cy - MAIN_HEIGHT / 2, w: mw, h: MAIN_HEIGHT, root: main });
    if (!this.playing) this.pulse(main);
  }
}
