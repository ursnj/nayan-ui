import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { audio, GameView, haptics, loadFont, World, type Camera, type Color, type DragEvent, type Entity, type Font } from "@nayan-ui/engine";

// Drop fruits into a jar; two of the same size merge into the next one. Physics stays in the XY
// plane (`planar`), so it plays like the 2D original but is lit, shadowed and seen through glass.
// Shows: planar physics, drag input, an orthographic camera, transparency, pop animations,
// particle bursts, camera shake and a 3D score.

const AUTOPLAY = process.env.EXPO_PUBLIC_AUTOPLAY === "1";
const FRUIT = 2; // collision layer
const JAR = 1;
const HALF_WIDTH = 3.6; // inner half-width of the jar
const TOP = 10.2; // fruits resting above this line end the game
const DROP_Y = 11.4;
const DEPTH = 4; // front to back: deeper than the biggest fruit
const LEVELS: { radius: number; color: Color }[] = [
  { radius: 0.32, color: [0.86, 0.15, 0.3] }, // cherry
  { radius: 0.42, color: [1, 0.45, 0.4] }, // strawberry
  { radius: 0.55, color: [0.55, 0.3, 0.85] }, // grape
  { radius: 0.68, color: [1, 0.65, 0.15] }, // orange
  { radius: 0.84, color: [0.95, 0.3, 0.2] }, // apple
  { radius: 1.02, color: [0.95, 0.9, 0.35] }, // pear
  { radius: 1.22, color: [1, 0.6, 0.7] }, // peach
  { radius: 1.45, color: [0.95, 0.8, 0.2] }, // pineapple
  { radius: 1.72, color: [0.35, 0.75, 0.3] }, // melon
];

const sfx = audio.load({
  drop: require("../../assets/sfx/flap.wav"),
  merge: require("../../assets/sfx/point.wav"),
  over: require("../../assets/sfx/gameover.wav"),
});

let best = 0;

function createGame(font: Font, onScore: (score: number) => void) {
  const world = new World(220);
  world.gravity = [0, -14, 0];
  const solid = { type: "fixed", layer: JAR, planar: true } as const;
  const jarColor: Color = [0.88, 0.92, 0.97];
  world.spawn({ mesh: "roundedBox", position: [0, -0.3, 0], scale: [HALF_WIDTH * 2 + 1, 0.6, DEPTH + 0.4], color: jarColor, physics: solid });
  for (const side of [-1, 1]) {
    world.spawn({ mesh: "roundedBox", position: [side * (HALF_WIDTH + 0.25), 5.5, 0], scale: [0.5, 12, DEPTH + 0.4], color: jarColor, physics: solid });
  }
  world.spawn({ mesh: "cube", position: [0, 5.5, -DEPTH / 2 - 0.05], scale: [HALF_WIDTH * 2, 12, 0.1], color: [0.95, 0.85, 0.7] });
  // The glass front: see-through (alpha < 1), drawn after everything solid. Visual only.
  world.spawn({ mesh: "cube", position: [0, 5.5, DEPTH / 2 + 0.05], scale: [HALF_WIDTH * 2, 12, 0.08], color: [0.75, 0.9, 1, 0.16], pickable: false });
  world.spawn({ mesh: "cube", position: [0, TOP, DEPTH / 2 + 0.12], scale: [HALF_WIDTH * 2, 0.04, 0.02], color: [1, 0.3, 0.3, 0.6] });
  const INK: Color = [0.42, 0.27, 0.14];
  const scoreText = world.spawn({ text: "0", font, position: [0, 13.6, 0], scale: 1.1, color: INK });

  const fruits = new Map<Entity, number>();
  const g = {
    world,
    score: 0,
    next: 0,
    aimX: 0,
    cooldown: 0,
    over: false,
    overAt: 0,
    elapsed: 0,
    dangerTime: 0,
    autoAt: 0,
    camera: { eye: [0, 6.6, 30], target: [0, 6.6, 0], fov: 0.5, ortho: 8.6 } as Camera,
  };
  const preview = world.spawn({ mesh: "sphere", position: [0, DROP_Y, 0], pickable: false });
  const guide = world.spawn({ mesh: "cube", position: [0, DROP_Y / 2, 0], scale: [0.04, DROP_Y, 0.04], color: [1, 1, 1, 0.25], pickable: false });

  const showNext = () => {
    const { radius, color } = LEVELS[g.next]!;
    world.set(preview, { scale: radius * 2, color, position: [g.aimX, DROP_Y, 0] });
    world.set(guide, { position: [g.aimX, DROP_Y / 2, 0] });
  };
  g.next = Math.floor(Math.random() * 4);
  showNext();

  function spawnFruit(level: number, x: number, y: number, pop: boolean) {
    const { radius, color } = LEVELS[level]!;
    const e = world.spawn({
      mesh: "sphere",
      position: [x, y, 0],
      scale: radius * 2, // the collider is sized now, from the full size...
      color,
      physics: { type: "dynamic", planar: true, layer: FRUIT, bounce: 0.15, friction: 0.4, density: 1 },
    });
    if (pop) {
      world.set(e, { scale: radius * 1.2 }); // ...then it's drawn small and grows back (visual only)
      world.animate(e, { scale: radius * 2 }, { duration: 0.35, easing: "back" });
    }
    fruits.set(e, level);
    return e;
  }

  function drop() {
    if (g.over || g.cooldown > 0) return;
    spawnFruit(g.next, g.aimX, DROP_Y, false);
    sfx.play("drop", { volume: 0.4, pitch: 1.4 - g.next * 0.1 });
    g.next = Math.floor(Math.random() * 4);
    g.cooldown = 0.5;
    world.set(preview, { scale: 0.01, color: LEVELS[g.next]!.color });
    world.animate(preview, { scale: LEVELS[g.next]!.radius * 2 }, { duration: 0.3, delay: 0.25, easing: "back" });
  }

  function merge(a: Entity, b: Entity, level: number) {
    const pa = world.position(a);
    const pb = world.position(b);
    if (!pa || !pb) return;
    fruits.delete(a);
    fruits.delete(b);
    world.despawn(a);
    world.despawn(b);
    const x = (pa[0] + pb[0]) / 2;
    const y = (pa[1] + pb[1]) / 2;
    const color = LEVELS[level]!.color;
    world.burst({ position: [x, y, 0.5], count: 10 + level * 3, speed: 3 + level, size: 0.12 + level * 0.02, color: [color, [1, 1, 1]] });
    g.score += (level + 1) * (level + 2);
    world.set(scoreText, { text: String(g.score) });
    world.animate(scoreText, { scale: 1.35 }, { duration: 0.12, yoyo: true, repeat: 1 });
    onScore(g.score);
    sfx.play("merge", { pitch: 0.8 + level * 0.08 });
    haptics.impact(0.3 + level * 0.07, 0.5);
    if (level + 1 < LEVELS.length) spawnFruit(level + 1, x, y, true);
    if (level >= 4) g.camera.shake = 0.08 * level;
  }

  function reset() {
    for (const e of fruits.keys()) world.despawn(e);
    fruits.clear();
    g.score = 0;
    g.over = false;
    g.dangerTime = 0;
    world.set(scoreText, { text: "0", color: INK });
    onScore(0);
  }

  return {
    world,
    camera: g.camera,
    drag(d: DragEvent) {
      if (g.over) {
        if (d.phase === "end") reset();
        return;
      }
      // Finger x -> world x, from where two known points land on screen.
      const origin = world.toScreen([0, DROP_Y, 0]);
      const unit = world.toScreen([1, DROP_Y, 0]);
      if (!origin || !unit) return;
      const limit = HALF_WIDTH - LEVELS[g.next]!.radius;
      g.aimX = Math.max(-limit, Math.min(limit, (d.x - origin[0]) / (unit[0] - origin[0])));
      showNext();
      if (d.phase === "end") drop();
    },
    update(dt: number) {
      g.elapsed += dt;
      g.cooldown -= dt;
      world.update(dt);
      const merged = new Set<Entity>();
      world.forEachCollision((a, b, info) => {
        if (!info.started || merged.has(a) || merged.has(b)) return;
        const la = fruits.get(a);
        if (la === undefined || la !== fruits.get(b)) return;
        merged.add(a).add(b);
        merge(a, b, la);
      });
      // Game over when fruits stay above the line.
      let high = false;
      for (const e of fruits.keys()) {
        const p = world.position(e);
        const v = world.velocity(e);
        if (p && v && p[1] + LEVELS[fruits.get(e)!]!.radius > TOP && Math.abs(v[1]) < 0.5) high = true;
      }
      g.dangerTime = high ? g.dangerTime + dt : 0;
      if (!g.over && g.dangerTime > 1.2) {
        g.over = true;
        g.overAt = g.elapsed;
        best = Math.max(best, g.score);
        world.set(scoreText, { text: "GAME OVER", color: [1, 0.4, 0.4] });
        sfx.play("over");
        haptics.notify("error");
      }
      if (AUTOPLAY) {
        if (g.over && g.elapsed - g.overAt > 2) reset();
        else if (!g.over && g.elapsed > g.autoAt) {
          const limit = HALF_WIDTH - LEVELS[g.next]!.radius;
          g.aimX = (Math.random() * 2 - 1) * limit;
          showNext();
          drop();
          g.autoAt = g.elapsed + 0.9;
        }
      }
    },
  };
}

export function FruitMerger() {
  const [font, setFont] = useState<Font | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    loadFont(require("../../assets/fonts/Inter-Bold.ttf"), { chars: "0123456789GAME OVR", depth: 0.3 }).then(setFont, console.error);
  }, []);

  const game = useMemo(() => (font ? createGame(font, setScore) : null), [font]);
  useEffect(() => () => game?.world.dispose(), [game]);

  return (
    <View style={styles.root}>
      {game && (
        <GameView
          source={game.world}
          camera={game.camera}
          light={{ direction: [0.3, 0.6, 1], ambient: 0.5, shadowExtent: 10 }}
          background={[0.98, 0.86, 0.66]}
          onUpdate={game.update}
          onDrag={game.drag}
        />
      )}
      <View style={styles.hud} pointerEvents="none">
        <Text style={styles.text}>Best {Math.max(best, score)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fadba8" },
  hud: { position: "absolute", top: 64, left: 16 },
  text: { color: "#6b4a2a", fontSize: 16, fontWeight: "700" },
});
