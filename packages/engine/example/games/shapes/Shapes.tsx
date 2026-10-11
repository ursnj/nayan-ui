import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { createShape, extrude, GameView, haptics, Path, World, type Camera, type Entity, type Light, type Quat } from "@nayan-ui/engine";
import { getFruits, type Fruit, type FruitKind } from "./fruits";
import { useGameTheme } from "../ui/theme";

// Custom shapes in action: fruit (lathes, tubes, extruded leaves) tossed up; tap one to slice it in
// two halves that fly apart, as in Fruit Ninja. A row of extruded SVG / Skia-style badges sits behind.
const GRAVITY = -9.81;
const KINDS: FruitKind[] = [
  "apple", "orange", "lemon", "pear", "strawberry", "watermelon", "banana",
  "cherries", "grapes", "kiwi", "mango", "peach", "pineapple", "pomegranate", "papaya",
];
/** How big each is drawn (fruit are built 1 unit across, plus stems and leaves). */
const SIZE: Partial<Record<FruitKind, number>> = { watermelon: 1.9, banana: 1.5, pineapple: 1.7, papaya: 1.6, grapes: 1.5, mango: 1.2, pomegranate: 1.2, cherries: 1.2, kiwi: 0.9 };
const LIGHT: Light = { direction: [0.4, 0.9, 0.6], ambient: 0.55, shadows: false };

const yTurn = (angle: number): Quat => [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)];
const rand = (min: number, max: number) => min + Math.random() * (max - min);

// Badges: a heart from SVG path data, a star, a ring (even-odd hole) and a rounded tag with a hole.
function makeBadges() {
  const heart = Path.fromSVG("M0.5 0.9 C0 0.55 0 0.12 0.27 0.12 C0.42 0.12 0.5 0.25 0.5 0.32 C0.5 0.25 0.58 0.12 0.73 0.12 C1 0.12 1 0.55 0.5 0.9 Z");
  const star = new Path().addStar(0, 0, 0.5, 0.22, 5);
  const ring = new Path().addCircle(0, 0, 0.5).addCircle(0, 0, 0.3);
  const tag = new Path().addRRect(0, 0, 1, 0.6, 0.15).addCircle(0.18, 0.3, 0.08);
  return [
    { mesh: createShape(extrude(heart, { depth: 0.18 }), { fit: 1, shine: 0.4 }), color: [0.95, 0.2, 0.35] as const },
    { mesh: createShape(extrude(star, { depth: 0.18 }), { fit: 1, shine: 0.6 }), color: [1, 0.78, 0.15] as const },
    { mesh: createShape(extrude(ring, { depth: 0.18, fillRule: "evenodd" }), { fit: 1, shine: 0.6 }), color: [0.3, 0.75, 0.95] as const },
    { mesh: createShape(extrude(tag, { depth: 0.12, fillRule: "evenodd" }), { fit: 1, shine: 0.3 }), color: [0.55, 0.35, 0.9] as const },
  ];
}
let badges: ReturnType<typeof makeBadges> | undefined;

type Flying = { entity: Entity; fruit: Fruit; scale: number };

function createScene() {
  const fruits = getFruits();
  badges ??= makeBadges();
  const world = new World(600);
  const camera: Camera = { eye: [0, 1.5, 12], target: [0, 1.5, 0], fov: 0.9 };
  badges.forEach((b, i) =>
    world.spawn({ mesh: b.mesh, position: [(i - 1.5) * 2.2, 5.2, -4], scale: 1.4, color: b.color, spin: [0, 0.8, 0], pickable: false }),
  );
  const flying: Flying[] = [];
  let timer = 0;
  let sliced = 0;
  return {
    world,
    camera,
    onSliced: (_n: number) => {},
    update(dt: number) {
      timer -= dt;
      if (timer <= 0) {
        timer = rand(0.5, 1.1);
        const kind = KINDS[Math.floor(Math.random() * KINDS.length)]!;
        const fruit = fruits[kind];
        const x = rand(-3.5, 3.5);
        const scale = SIZE[kind] ?? 1.1;
        const entity = world.spawn({
          mesh: fruit.whole,
          position: [x, -4, 0],
          scale,
          velocity: [-x * rand(0.15, 0.3), rand(10.5, 12.5), 0],
          acceleration: [0, GRAVITY, 0],
          spin: [rand(-2, 2), rand(-3, 3), rand(-2, 2)],
        });
        flying.push({ entity, fruit, scale });
      }
      for (let i = flying.length - 1; i >= 0; i--) {
        const p = world.position(flying[i]!.entity);
        if (!p || p[1] < -6) {
          world.despawn(flying[i]!.entity);
          flying.splice(i, 1);
        }
      }
      world.update(dt);
    },
    /** Slices the fruit under a tap. */
    tap(x: number, y: number) {
      const hit = world.pick(x, y);
      const index = hit ? flying.findIndex((f) => f.entity === hit.entity) : -1;
      if (index < 0) return;
      const { entity, fruit, scale } = flying[index]!;
      flying.splice(index, 1);
      const at = world.position(entity);
      const v = world.velocity(entity) ?? [0, 0, 0];
      world.despawn(entity);
      if (!at) return;
      // Two halves, cut faces toward each other: a half's cut faces +Z, so the left one turns to face
      // +X and the right one -X.
      for (const side of [-1, 1]) {
        world.spawn({
          mesh: fruit.pieces[side < 0 ? 0 : 1],
          position: [at[0] + side * 0.05, at[1], at[2]],
          rotation: yTurn(-side * (Math.PI / 2)),
          scale,
          velocity: [v[0] + side * 3, v[1] * 0.4 + 2, 0],
          acceleration: [0, GRAVITY, 0],
          spin: [0, 0, side * -4],
          lifetime: 1.6,
          pickable: false,
        });
      }
      world.burst({ position: at, count: 18, size: 0.12, speed: 5, lifetime: 0.6, color: fruit.juice });
      haptics.impact(0.6, 0.6);
      sliced += 1;
      this.onSliced(sliced);
    },
  };
}

export function Shapes() {
  const scene = useMemo(createScene, []);
  const theme = useGameTheme();
  const [sliced, setSliced] = useState(0);
  useEffect(() => {
    scene.onSliced = setSliced;
    return () => scene.world.dispose();
  }, [scene]);
  const onUpdate = useMemo(() => (dt: number) => scene.update(dt), [scene]);
  const onTap = useMemo(() => (x: number, y: number) => scene.tap(x, y), [scene]);
  const sky = theme.dark ? ([0.1, 0.1, 0.16] as const) : ([0.93, 0.9, 0.84] as const);
  return (
    <View style={styles.root}>
      <GameView source={scene.world} camera={scene.camera} light={LIGHT} background={sky} onUpdate={onUpdate} onTap={onTap} />
      <Text style={[styles.hint, { color: theme.TEXT }]} pointerEvents="none">
        Tap fruit to slice it · sliced {sliced}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hint: { position: "absolute", bottom: 40, alignSelf: "center", fontSize: 15, fontWeight: "800" },
});
