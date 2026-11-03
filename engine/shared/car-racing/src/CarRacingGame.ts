// Car Racing's rules, with no React: `createGame(world, assets)` builds the road, cars and camera in a
// world that `useWorld` owns; `tick` is the game's per-frame work (GameView steps the world after it).
import { audio, type Camera, type ColorInput, effects, type Entity, haptics, type MutableQuat, quat, type Voice, type World } from '@nayan-ui/engine';
import {
  type Assets,
  EDGE,
  LANES,
  LATERAL_SPEED,
  LIVES,
  PASS_POINTS,
  PLAYER_COLOR,
  ROAD_WIDTH,
  SPEED,
  TILE,
  TILES,
  TRACK_LENGTH,
  TRAFFIC,
  TRAFFIC_COLORS,
  TRAFFIC_SPEED
} from './CarRacingConstants';
import { treeMesh } from './CarRacingMeshes';
import { metresLeft, touching } from './CarRacingRules';

export type Phase = 'ready' | 'playing' | 'won' | 'lost';

/** One road tile: its entities and their fixed place across the tile; only z changes. */
type Tile = { z: number; parts: { entity: Entity; x: number; y: number }[] };
type Rival = { entity: Entity; x: number; z: number; hit: boolean };

export type Game = ReturnType<typeof createGame>;

const pick = <T>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]!;

export function createGame(world: World, assets: Assets, onPhase: (phase: Phase) => void, onDistance: (left: number) => void) {
  const tree = treeMesh();
  const camera: Camera = { eye: [0, 4, 9], target: [0, 1, -6], fov: 0.95 };
  const turn: MutableQuat = [0, 0, 0, 1]; // Scratch for the steering tilt, reused every frame.

  // Road: each tile is asphalt, grass, two lane dashes and a tree on each side; tiles behind the
  // camera jump to the front, so a 1.5 km race uses the same 26 tiles.
  const tiles: Tile[] = [];
  for (let i = 0; i < TILES; i++) {
    const z = -i * TILE;
    const side = (s: number) => s * (ROAD_WIDTH / 2 + 3 + Math.random() * 8);
    const part = (x: number, y: number, options: Parameters<World['spawn']>[0]) => ({
      entity: world.spawn({ ...options, position: [x, y, z], pickable: false }),
      x,
      y
    });
    tiles.push({
      z,
      parts: [
        part(0, -0.02, { mesh: 'plane', texture: assets.grass, scale: [80, 1, TILE] }),
        part(0, 0, { mesh: 'plane', texture: assets.asphalt, scale: [ROAD_WIDTH, 1, TILE] }),
        part(-1.7, 0.01, { mesh: 'cube', color: 'white', scale: [0.15, 0.02, TILE / 2] }),
        part(1.7, 0.01, { mesh: 'cube', color: 'white', scale: [0.15, 0.02, TILE / 2] }),
        part(side(-1), 0, { mesh: tree }),
        part(side(1), 0, { mesh: tree })
      ]
    });
  }
  const moveTile = (tile: Tile, z: number) => {
    tile.z = z;
    for (const p of tile.parts) world.transforms.position(p.entity, p.x, p.y, z);
  };
  const finish = world.spawn({ mesh: 'cube', color: 'white', position: [0, 0.02, -TRACK_LENGTH], scale: [ROAD_WIDTH, 0.04, 1.2] });

  // A car is an empty root that moves, with the three model parts attached; only the paint is tinted.
  const spawnCar = (color: ColorInput) => {
    const root = world.spawn({ mesh: 'none' });
    world.spawn({ mesh: assets.car.body, parent: root, color, pickable: false });
    world.spawn({ mesh: assets.car.glass, parent: root, pickable: false });
    world.spawn({ mesh: assets.car.trim, parent: root, pickable: false });
    return root;
  };
  const player = spawnCar(PLAYER_COLOR);
  const rivals: Rival[] = Array.from({ length: TRAFFIC }, () => ({
    entity: spawnCar(pick(TRAFFIC_COLORS)),
    x: 0,
    z: 0,
    hit: false
  }));
  camera.follow = { target: player, offset: [0, 3.6, 8.5], smoothing: 0.12 };

  const g = {
    world,
    camera,
    phase: 'ready' as Phase,
    x: 0,
    z: 0,
    target: 0, // where steering wants the car, across the road
    keys: 0, // -1, 0 or 1 while a steering key is held
    safe: 0, // seconds of invulnerability left after a crash
    engine: null as Voice | null,
    reportedLeft: -1
  };

  const placeRival = (r: Rival, z: number) => {
    r.x = pick(LANES);
    r.z = z;
    r.hit = false;
  };

  const setPhase = (phase: Phase) => {
    g.phase = phase;
    onPhase(phase);
  };

  const finishRace = (won: boolean) => {
    if (g.phase !== 'playing') return;
    world.scoreboard.stop();
    audio.stop(g.engine);
    g.engine = null;
    if (won) {
      world.scoreboard.add(world.scoreboard.lives * 100);
      effects.confetti(world, {
        position: [g.x, 3, g.z - 6],
        colors: ['#FF4D4D', '#FFD933', '#4DB3FF'],
        size: 0.14,
        speed: 7,
        count: 60,
        lifetime: 1.6,
        gravity: -6
      });
      assets.sounds.play('win', { volume: 0.8 });
      haptics.notify('success');
    } else {
      assets.sounds.play('die', { volume: 0.8 });
      haptics.notify('error');
    }
    setPhase(won ? 'won' : 'lost');
  };

  // The game's own rule; the screen follows score and lives with scoreboard.listen.
  world.scoreboard.handlers = { onLivesOut: () => finishRace(false) };

  const reset = () => {
    audio.stop(g.engine);
    g.engine = null;
    Object.assign(g, { x: 0, z: 0, target: 0, keys: 0, safe: 0, reportedLeft: -1 });
    tiles.forEach((tile, i) => moveTile(tile, -i * TILE));
    rivals.forEach((r, i) => placeRival(r, -40 - i * 24));
    world.scoreboard.reset(LIVES);
    setPhase('ready');
    onDistance(TRACK_LENGTH);
  };

  const start = () => {
    if (g.phase !== 'ready') reset();
    world.scoreboard.resume();
    g.engine = assets.sounds.play('engine', { volume: 0.3, loop: true });
    setPhase('playing');
  };

  /** Steering from a drag: dx is the finger's travel as a fraction of the view's width. */
  const drag = (fromX: number, dx: number) => {
    g.target = Math.max(-EDGE, Math.min(EDGE, fromX + dx * ROAD_WIDTH * 1.4));
  };

  /** GameView's onUpdate: the game's own per-frame work. GameView steps the world right after. */
  const tick = (dt: number) => {
    if (g.phase === 'playing') {
      g.z -= SPEED * dt;
      if (g.keys) g.target = Math.max(-EDGE, Math.min(EDGE, g.target + g.keys * LATERAL_SPEED * dt));
      g.safe = Math.max(0, g.safe - dt);
    }
    const lean = g.target - g.x;
    g.x += lean * Math.min(1, dt * 8);
    quat.y(-lean * 0.08, turn);
    world.transforms.transform(player, g.x, 0, g.z, turn[0], turn[1], turn[2], turn[3]);

    // Recycle road tiles that fall behind the camera to the front.
    for (const tile of tiles) if (tile.z > g.z + TILE * 2) moveTile(tile, tile.z - TILES * TILE);

    // Traffic drives ahead slower than the player: overtaking scores, touching costs a life.
    const farthest = Math.min(...rivals.map((r) => r.z));
    for (const r of rivals) {
      if (g.phase === 'playing') r.z -= TRAFFIC_SPEED * dt;
      if (r.z > g.z + 12) {
        if (!r.hit && g.phase === 'playing') {
          world.scoreboard.add(PASS_POINTS);
          assets.sounds.play('point', { volume: 0.4 });
        }
        placeRival(r, farthest - 18 - Math.random() * 14);
      }
      if (g.phase === 'playing' && !r.hit && g.safe === 0 && touching(g.x, g.z, r.x, r.z)) {
        r.hit = true;
        g.safe = 1.2;
        camera.shake = 0.35;
        effects.sparks(world, { position: [g.x, 0.8, g.z - 1.5], colors: ['#FFD54F', '#FF8A65'], size: 0.08, speed: 6, count: 18, lifetime: 0.5 });
        assets.sounds.play('hit', { volume: 0.9 });
        haptics.impact(0.8);
        world.scoreboard.addLives(-1); // onLivesOut ends the race at zero
      }
      world.transforms.position(r.entity, r.x, 0, r.z);
    }

    const left = metresLeft(TRACK_LENGTH, g.z);
    if (left !== g.reportedLeft) {
      g.reportedLeft = left;
      onDistance(left);
    }
    if (g.phase === 'playing' && -g.z >= TRACK_LENGTH) finishRace(true);
  };

  const dispose = () => {
    audio.stop(g.engine);
    g.engine = null;
  };

  reset();
  return Object.assign(g, { start, reset, tick, drag, dispose, finish });
}
