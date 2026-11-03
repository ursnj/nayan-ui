// Starter programs for the playground. Each one default-exports the component the preview renders.
export interface PlaygroundExample {
  id: string;
  title: string;
  /** The group it's listed under in the picker. */
  category: "Basics" | "Games" | "Assets" | "Input" | "Effects and physics";
  code: string;
}

/** The picker's groups, in order. */
export const PLAYGROUND_CATEGORIES: PlaygroundExample["category"][] = [
  "Basics",
  "Games",
  "Assets",
  "Input",
  "Effects and physics",
];

export const PLAYGROUND_EXAMPLES: PlaygroundExample[] = [
  {
    id: "bouncing-ball",
    category: "Basics",
    title: "Bouncing ball",
    code: `import { useRef } from "react";
import { GameView, useWorld, type Entity } from "@nayan-ui/engine";

// A ground plane and a ball with physics. Tap to throw the ball up again.
export default function BouncingBall() {
  const ball = useRef<Entity | null>(null);
  const world = useWorld(100, (w) => {
    w.spawn({ mesh: "plane", scale: [20, 1, 20], color: "#4C9A4C", physics: "fixed" });
    ball.current = w.spawn({ mesh: "sphere", position: [0, 5, 0], color: "#3399FF", physics: { type: "dynamic", bounce: 0.6 } });
  });

  return (
    world && (
      <GameView
        source={world}
        camera={{ eye: [0, 4, 8], target: [0, 0, 0], fov: 1 }}
        background="#BFE3FF"
        onTap={() => ball.current !== null && world.impulse(ball.current, [0, 6, 0])}
        style={{ flex: 1 }}
      />
    )
  );
}
`,
  },
  {
    id: "tap-to-pop",
    category: "Input",
    title: "Tap to pop",
    code: `import { useRef } from "react";
import { effects, GameView, useWorld, type Entity, type World } from "@nayan-ui/engine";

const COLORS = ["#FF5A5F", "#FFB400", "#00A699", "#3399FF", "#8E44AD"];

// Five spinning cubes in a row.
function fill(world: World, cubes: Set<Entity>) {
  COLORS.forEach((color, i) => cubes.add(world.spawn({ mesh: "cube", position: [(i - 2) * 1.6, 0, 0], color, spin: [0.4, 0.8, 0] })));
}

// Tap a cube to pop it; they come back when all are gone.
export default function TapToPop() {
  const cubes = useRef(new Set<Entity>()).current;
  const world = useWorld(64, (w) => fill(w, cubes));

  return (
    world && (
      <GameView
        source={world}
        camera={{ eye: [0, 0, 9], target: [0, 0, 0], fov: 1 }}
        background="#1B1F3B"
        onTap={(x, y) => {
          const hit = world.pick(x, y);
          if (!hit || !cubes.delete(hit.entity)) return;
          const piece = hit.entity;
          effects.sparkle(world, { position: hit.point, colors: "#FFD933", size: 0.08, speed: 3, count: 14, lifetime: 0.6 });
          void effects.pop(world, piece, { scale: 1 }).then(() => world.despawn(piece));
          if (cubes.size === 0) setTimeout(() => fill(world, cubes), 800);
        }}
        style={{ flex: 1 }}
      />
    )
  );
}
`,
  },
  {
    id: "game-loop",
    category: "Basics",
    title: "Game loop",
    code: `import { useRef } from "react";
import { GameView, useWorld, type Entity } from "@nayan-ui/engine";

// onUpdate runs every frame: move a box in a circle without React state.
export default function GameLoop() {
  const box = useRef<Entity | null>(null);
  const time = useRef(0);
  const world = useWorld(16, (w) => {
    w.spawn({ mesh: "plane", scale: [12, 1, 12], color: "#2E3A59" });
    box.current = w.spawn({ mesh: "roundedBox", position: [3, 0.5, 0], color: "#FFB400" });
  });

  return (
    world && (
      <GameView
        source={world}
        camera={{ eye: [0, 7, 8], target: [0, 0, 0], fov: 1 }}
        background="#0F172A"
        onUpdate={(dt) => {
          time.current += dt;
          if (box.current !== null) world.transforms.position(box.current, Math.cos(time.current) * 3, 0.5, Math.sin(time.current) * 3);
        }}
        style={{ flex: 1 }}
      />
    )
  );
}
`,
  },
  {
    id: "confetti",
    category: "Effects and physics",
    title: "Confetti",
    code: `import { effects, GameView, useWorld } from "@nayan-ui/engine";

// Tap anywhere to celebrate.
export default function Confetti() {
  const world = useWorld(512, (w) => {
    w.spawn({ mesh: "torus", position: [0, 0, 0], color: "#FF4D4D", spin: [0.5, 1, 0] });
  });

  return (
    world && (
      <GameView
        source={world}
        camera={{ eye: [0, 0, 7], target: [0, 0, 0], fov: 1 }}
        background="#14213D"
        onTap={() =>
          effects.confetti(world, {
            position: [0, 1, 0],
            colors: ["#FF4D4D", "#FFD933", "#3399FF"],
            size: 0.12,
            speed: 6,
            count: 60,
            lifetime: 1.4,
            gravity: -6,
          })
        }
        style={{ flex: 1 }}
      />
    )
  );
}
`,
  },
  {
    id: "tic-tac-toe",
    title: "Tic-tac-toe",
    category: "Games",
    code: `import { useRef, useState } from "react";
import { createShape, effects, frontLight, GameView, quat, shapeGeometry, useWorld, type Entity, type Model, type Vec3, type World } from "@nayan-ui/engine";

type Mark = "X" | "O" | null;
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const cell = (i: number): Vec3 => [((i % 3) - 1) * 2.2, (1 - Math.floor(i / 3)) * 2.2, 0];
const winner = (marks: Mark[]) => LINES.find(([a, b, c]) => marks[a] && marks[a] === marks[b] && marks[a] === marks[c]);

// Glossy meshes, built once (after the engine starts) and reused by every round.
let meshes: { wood: Model; tile: Model; bar: Model; ring: Model } | undefined;
const buildMeshes = () => ({
  wood: createShape(shapeGeometry("roundedBox"), { shine: 0.2 }),
  tile: createShape(shapeGeometry("roundedBox"), { shine: 0.35 }),
  bar: createShape(shapeGeometry("roundedBox"), { shine: 0.8 }),
  ring: createShape(shapeGeometry("torus"), { shine: 0.8 }),
});

// The computer (O): win if it can, block X if it must, else the centre, a corner or any cell.
function choose(marks: Mark[]): number {
  for (const mark of ["O", "X"] as const)
    for (const line of LINES) {
      const empty = line.filter((i) => !marks[i]);
      if (empty.length === 1 && line.filter((i) => marks[i] === mark).length === 2) return empty[0]!;
    }
  return [4, 0, 2, 6, 8, 1, 3, 5, 7].find((i) => !marks[i])!;
}

// You are X; tap a square. Each round starts with a fresh world.
export default function TicTacToe() {
  const [round, setRound] = useState(0);
  return <Board key={round} onRestart={() => setRound((r) => r + 1)} />;
}

function Board({ onRestart }: { onRestart: () => void }) {
  const cells = useRef<Entity[]>([]);
  const marks = useRef<Mark[]>(Array(9).fill(null));
  const [status, setStatus] = useState("Your turn: tap a square");
  const [done, setDone] = useState(false);

  const world = useWorld(64, (w) => {
    const m = (meshes ??= buildMeshes());
    // A wooden board with a raised frame, and nine inlaid squares.
    w.spawn({ mesh: m.wood, position: [0, 0, -0.45], scale: [7.6, 7.6, 0.5], color: "#6B3F24" });
    w.spawn({ mesh: m.wood, position: [0, 0, -0.25], scale: [7, 7, 0.2], color: "#8A5A36", pickable: false });
    cells.current = Array.from({ length: 9 }, (_, i) => w.spawn({ mesh: m.tile, position: cell(i), scale: [2.05, 2.05, 0.25], color: "#EAD7B7" }));
  });

  // A piece drops onto its square with a bounce and a puff of sawdust.
  const place = (w: World, i: number, mark: "X" | "O") => {
    const m = meshes!;
    marks.current[i] = mark;
    const [x, y] = cell(i);
    const parts =
      mark === "X"
        ? [Math.PI / 4, -Math.PI / 4].map((angle) =>
            w.spawn({ mesh: m.bar, position: [x, y, 2.5], rotation: quat.z(angle), scale: [1.6, 0.34, 0.34], color: "#D62828", pickable: false }),
          )
        : [w.spawn({ mesh: m.ring, position: [x, y, 2.5], rotation: quat.x(Math.PI / 2), scale: [1.25, 1.6, 1.25], color: "#1D6FD8", pickable: false })];
    for (const part of parts) w.animate(part, { position: [x, y, 0.35] }, { duration: 0.35, easing: "bounce" });
    w.after(0.18, () => effects.dust(w, { position: [x, y, 0.3], color: "rgba(234,215,183,0.8)", size: 0.25, speed: 1.5, count: 8, lifetime: 0.5 }));
  };

  // A line of three wins: a gold bar slides across it. A full board is a draw.
  const finish = (w: World) => {
    const line = winner(marks.current);
    if (line) {
      const [ax, ay] = cell(line[0]!);
      const [cx, cy] = cell(line[2]!);
      const strike = w.spawn({ mesh: meshes!.bar, position: [(ax + cx) / 2, (ay + cy) / 2, 0.8], rotation: quat.z(Math.atan2(cy - ay, cx - ax)), scale: [0, 0.22, 0.22], color: "#FFC233", pickable: false });
      w.animate(strike, { scale: [Math.hypot(cx - ax, cy - ay) + 1.8, 0.22, 0.22] }, { duration: 0.4, easing: "easeOut" });
      const won = marks.current[line[0]!] === "X";
      if (won) effects.confetti(w, { position: [0, 0, 1.5], colors: ["#D62828", "#FFC233", "#1D6FD8"], size: 0.12, speed: 6, count: 70, lifetime: 1.5, gravity: -6 });
      setStatus(won ? "You win!" : "The computer wins");
    } else if (marks.current.every(Boolean)) setStatus("It's a draw");
    else return false;
    setDone(true);
    return true;
  };

  if (!world) return null;
  return (
    <div style={{ flex: 1, display: "flex", position: "relative" }}>
      <GameView
        source={world}
        camera={{ eye: [0, -5.5, 11.5], target: [0, -0.3, 0], fov: 0.8 }}
        light={frontLight([-0.5, 0.7, 1], 0.5)}
        background="#1B2430"
        onTap={(x, y) => {
          const hit = world.pick(x, y);
          const i = hit ? cells.current.indexOf(hit.entity) : -1;
          if (done || i < 0 || marks.current[i]) return;
          place(world, i, "X");
          if (finish(world)) return;
          setStatus("The computer is thinking…");
          world.after(0.6, () => {
            place(world, choose(marks.current), "O");
            world.after(0.35, () => !finish(world) && setStatus("Your turn: tap a square"));
          });
        }}
        style={{ flex: 1 }}
      />
      <div style={HUD}>
        {status}
        {done && <button onClick={onRestart} style={BUTTON}>Play again</button>}
      </div>
    </div>
  );
}

const HUD = { position: "absolute" as const, left: 12, top: 12, display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.92)", color: "#0F172A", fontWeight: 700 };
const BUTTON = { padding: "4px 10px", borderRadius: 8, border: "none", background: "#6366F1", color: "white", fontWeight: 600, cursor: "pointer" };
`,
  },
  {
    id: "whack-a-mole",
    title: "Whack-a-mole",
    category: "Games",
    code: `import { useRef, useState } from "react";
import { createShape, effects, GameView, lathe, merge, shapeGeometry, useWorld, type Camera, type Entity, type Model, type World } from "@nayan-ui/engine";

type Mole = { entity: Entity; x: number; z: number; up: boolean };
const ROUND = 30; // seconds
const DOWN = -0.9; // a hidden mole's height

// A mole with eyes and a nose, a dirt mound and a tuft of grass: built once, reused every round.
let meshes: { mole: Model; mound: Model; tuft: Model } | undefined;
const buildMeshes = () => ({
  mole: createShape(
    merge([
      { geometry: shapeGeometry("capsule", { color: [0.42, 0.28, 0.18] }), scale: [0.9, 1.1, 0.9] },
      { geometry: shapeGeometry("sphere", { color: [0.9, 0.78, 0.65] }), position: [0, 0.05, 0.36], scale: [0.55, 0.45, 0.3] },
      { geometry: shapeGeometry("sphere", { color: [0.05, 0.05, 0.05] }), position: [-0.16, 0.38, 0.38], scale: 0.12 },
      { geometry: shapeGeometry("sphere", { color: [0.05, 0.05, 0.05] }), position: [0.16, 0.38, 0.38], scale: 0.12 },
      { geometry: shapeGeometry("sphere", { color: [0.95, 0.45, 0.55] }), position: [0, 0.2, 0.52], scale: 0.14 },
    ]),
    { shine: 0.2 },
  ),
  mound: createShape(lathe([[0.62, 0.22], [0.75, 0.24], [1.05, 0.1], [1.2, 0]], { segments: 32, color: [0.36, 0.24, 0.14] })),
  tuft: createShape(merge([-0.12, 0, 0.12].map((x) => ({ geometry: shapeGeometry("cone", { color: [0.3, 0.6, 0.25] }), position: [x, 0.15, 0] as [number, number, number], scale: [0.08, 0.35, 0.08] as [number, number, number] })))),
});

// Whack the moles before they duck. The engine's scoreboard keeps the score and the countdown.
export default function WhackAMole() {
  const [round, setRound] = useState(0);
  return <Game key={round} onRestart={() => setRound((r) => r + 1)} />;
}

function Game({ onRestart }: { onRestart: () => void }) {
  const camera = useRef<Camera>({ eye: [0, 7.5, 7.5], target: [0, 0, 0.5], fov: 0.85 }).current;
  const moles = useRef<Mole[]>([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(ROUND);
  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");

  const world = useWorld(128, (w) => {
    const m = (meshes ??= buildMeshes());
    w.spawn({ mesh: "plane", scale: [30, 1, 30], color: "#5E9E4F" });
    for (let i = 0; i < 40; i++) w.spawn({ mesh: m.tuft, position: [(Math.random() - 0.5) * 14, 0, (Math.random() - 0.5) * 10], spin: [0, 0, 0], pickable: false });
    moles.current = Array.from({ length: 9 }, (_, i) => {
      const x = ((i % 3) - 1) * 2.6;
      const z = (Math.floor(i / 3) - 1) * 2.4;
      w.spawn({ mesh: m.mound, position: [x, 0, z], pickable: false });
      w.spawn({ mesh: "cylinder", position: [x, 0.22, z], scale: [1.2, 0.02, 1.2], color: "#1A0F08", pickable: false });
      return { entity: w.spawn({ mesh: m.mole, position: [x, DOWN, z] }), x, z, up: false };
    });
    w.scoreboard.reset(0, ROUND); // a ready screen: score 0, the full countdown, stopped
    w.scoreboard.handlers = {
      onTimeUp: () => {
        w.cancelTimers();
        for (const mole of moles.current) hide(w, mole);
        setPhase("over");
      },
    };
    return w.scoreboard.listen({ onScore: setScore, onSecond: setTime });
  });

  function hide(w: World, mole: Mole) {
    if (!mole.up) return;
    mole.up = false;
    w.animate(mole.entity, { position: [mole.x, DOWN, mole.z] }, { duration: 0.18, easing: "easeIn" });
  }

  // A mole pops up with a bounce every 0.65 s, and ducks again after 0.85 s unless it's hit first.
  const popUp = (w: World) => {
    const hidden = moles.current.filter((m) => !m.up);
    const mole = hidden[Math.floor(Math.random() * hidden.length)];
    if (mole) {
      mole.up = true;
      w.set(mole.entity, { scale: 1 });
      w.animate(mole.entity, { position: [mole.x, 0.55, mole.z] }, { spring: "bouncy" });
      w.after(0.85, () => hide(w, mole));
    }
    w.after(0.65, () => popUp(w));
  };

  const start = () => {
    if (!world) return;
    setPhase("playing");
    world.scoreboard.resume();
    popUp(world);
  };

  if (!world) return null;
  return (
    <div style={{ flex: 1, display: "flex", position: "relative" }}>
      <GameView
        source={world}
        camera={camera}
        background="#A8D8FF"
        fog={0.02}
        onTap={(x, y) => {
          if (phase !== "playing") return;
          const hit = world.pick(x, y);
          const mole = moles.current.find((m) => m.up && m.entity === hit?.entity);
          if (!mole) return;
          // A hit: squash, a puff of dirt, a little camera shake, then the mole ducks.
          world.scoreboard.add(1);
          camera.shake = 0.12;
          world.animate(mole.entity, { scale: [1.35, 0.55, 1.35] }, { duration: 0.08 });
          effects.dust(world, { position: [mole.x, 0.3, mole.z], color: ["rgba(110,80,50,0.8)", "rgba(150,115,80,0.7)"], size: 0.3, speed: 2.5, count: 12, lifetime: 0.6 });
          effects.sparkle(world, { position: [mole.x, 1.1, mole.z], colors: "#FFD933", size: 0.08, speed: 3, count: 10, lifetime: 0.5 });
          world.after(0.1, () => hide(world, mole));
        }}
        style={{ flex: 1 }}
      />
      <div style={HUD}>
        Score {score} · {time}s
        {phase === "ready" && <button onClick={start} style={BUTTON}>Start</button>}
        {phase === "over" && <button onClick={onRestart} style={BUTTON}>Play again</button>}
      </div>
    </div>
  );
}

const HUD = { position: "absolute" as const, left: 12, top: 12, display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.92)", color: "#0F172A", fontWeight: 700 };
const BUTTON = { padding: "4px 10px", borderRadius: 8, border: "none", background: "#6366F1", color: "white", fontWeight: 600, cursor: "pointer" };
`,
  },
  {
    id: "stack-tower",
    title: "Stack tower",
    category: "Games",
    code: `import { useRef, useState } from "react";
import { createShape, effects, GameView, shapeGeometry, useWorld, type Camera, type Entity, type Model, type World } from "@nayan-ui/engine";

const HEIGHT = 0.5; // each block's height
const PERFECT = 0.12; // land this close to the block below for a perfect drop
const levelY = (level: number) => (level - 0.5) * HEIGHT;

// A colour that drifts round the colour wheel as the tower grows (HSL to hex).
function color(level: number) {
  const h = (level * 14) % 360, s = 0.65, l = 0.55;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const v = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255).toString(16).padStart(2, "0");
  };
  return \`#\${f(0)}\${f(8)}\${f(4)}\`;
}

let block: Model | undefined; // one glossy block mesh, reused for every level

// Tap to drop the sliding block. The overhang is cut off and falls; land it dead on for a perfect drop.
export default function StackTower() {
  const [round, setRound] = useState(0);
  return <Tower key={round} onRestart={() => setRound((r) => r + 1)} />;
}

function Tower({ onRestart }: { onRestart: () => void }) {
  const camera = useRef<Camera>({ eye: [7, 6, 9], target: [0, 1, 0], fov: 0.85 }).current;
  const s = useRef({ block: null as Entity | null, x: -4.5, dir: 1, width: 3, below: 0, level: 0, combo: 0, over: false }).current;
  const [score, setScore] = useState(0);
  const [note, setNote] = useState("");
  const [over, setOver] = useState(false);

  const next = (w: World) => {
    s.level++;
    s.x = -4.5;
    s.dir = 1;
    s.block = w.spawn({ mesh: block!, position: [s.x, levelY(s.level), 0], scale: [s.width, HEIGHT, 3], color: color(s.level) });
  };

  const world = useWorld(256, (w) => {
    block ??= createShape(shapeGeometry("cube"), { shine: 0.45 });
    w.spawn({ mesh: block, position: [0, -2, 0], scale: [3, 4, 3], color: "#2B3445", physics: "fixed" });
    w.spawn({ mesh: "plane", position: [0, -4, 0], scale: [40, 1, 40], color: "#0E1626" });
    next(w);
  });

  const drop = (w: World) => {
    if (s.over || s.block === null) return;
    let offset = s.x - s.below;
    const y = levelY(s.level);
    if (Math.abs(offset) <= PERFECT) {
      // Perfect: snap onto the block below, a flash, and the combo grows.
      offset = 0;
      s.combo++;
      effects.flash(w, { position: [s.below, y, 1.6], color: [2, 2, 2], size: 1.2 });
      setNote(s.combo > 1 ? \`Perfect ×\${s.combo}\` : "Perfect!");
    } else {
      s.combo = 0;
      setNote("");
    }
    const overlap = s.width - Math.abs(offset);
    if (overlap <= 0) {
      // Missed completely: the block tumbles off and the game ends.
      w.set(s.block, { physics: "dynamic" });
      s.over = true;
      setOver(true);
      return;
    }
    const center = s.below + offset / 2;
    w.set(s.block, { position: [center, y, 0], scale: [overlap, HEIGHT, 3], physics: "fixed" });
    const cut = s.width - overlap;
    if (cut > 0.02) {
      const side = Math.sign(offset);
      w.spawn({ mesh: block!, position: [center + side * (overlap / 2 + cut / 2), y, 0], scale: [cut, HEIGHT, 3], color: color(s.level), physics: "dynamic", lifetime: 4 });
    }
    s.below = center;
    s.width = overlap;
    setScore(s.level);
    next(w);
  };

  if (!world) return null;
  return (
    <div style={{ flex: 1, display: "flex", position: "relative" }}>
      <GameView
        source={world}
        camera={camera}
        background="#14213D"
        fog={0.03}
        onUpdate={(dt) => {
          // Slide the block back and forth, faster each level; the camera rises with the tower.
          if (s.block !== null && !s.over) {
            s.x += s.dir * dt * (3 + s.level * 0.12);
            if (Math.abs(s.x) > 4.5) s.dir = -Math.sign(s.x);
            world.transforms.position(s.block, s.x, levelY(s.level), 0);
          }
          const y = s.level * HEIGHT;
          camera.target[1] += (y - camera.target[1]) * Math.min(1, dt * 3);
          camera.eye[1] = camera.target[1] + 5;
        }}
        onTap={() => drop(world)}
        style={{ flex: 1 }}
      />
      <div style={HUD}>
        Height {score}
        {note && <span style={{ color: "#16A34A" }}>{note}</span>}
        {over && <button onClick={onRestart} style={BUTTON}>Play again</button>}
      </div>
    </div>
  );
}

const HUD = { position: "absolute" as const, left: 12, top: 12, display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.92)", color: "#0F172A", fontWeight: 700 };
const BUTTON = { padding: "4px 10px", borderRadius: 8, border: "none", background: "#6366F1", color: "white", fontWeight: 600, cursor: "pointer" };
`,
  },
  {
    id: "memory-match",
    title: "Memory match",
    category: "Games",
    code: `import { useRef, useState } from "react";
import { createShape, effects, frontLight, GameView, merge, quat, shapeGeometry, useWorld, type Entity, type Model, type Shape, type World } from "@nayan-ui/engine";

// Six pairs: a symbol shape and its colour on each card's face.
const SYMBOLS: { shape: Shape; color: string }[] = [
  { shape: "sphere", color: "#E53935" },
  { shape: "cube", color: "#1E88E5" },
  { shape: "cone", color: "#43A047" },
  { shape: "torus", color: "#FB8C00" },
  { shape: "cylinder", color: "#8E24AA" },
  { shape: "capsule", color: "#00ACC1" },
];
type Card = { entity: Entity; symbol: number; open: boolean; matched: boolean };

// One card mesh at its real size: a blue body, a patterned back (+z) and a white face (-z).
let card: Model | undefined;
const buildCard = () =>
  createShape(
    merge([
      { geometry: shapeGeometry("roundedBox", { color: [0.18, 0.29, 0.54] }), scale: [1.55, 2.1, 0.12] },
      { geometry: shapeGeometry("roundedBox", { color: [0.24, 0.37, 0.69] }), position: [0, 0, 0.065], scale: [1.1, 1.6, 0.02] },
      { geometry: shapeGeometry("roundedBox", { color: [0.98, 0.98, 0.96] }), position: [0, 0, -0.065], scale: [1.42, 1.95, 0.02] },
    ]),
    { shine: 0.4 },
  );

// Each card has a patterned back and a white face with a symbol. Find all six pairs.
export default function MemoryMatch() {
  const [round, setRound] = useState(0);
  return <Table key={round} onRestart={() => setRound((r) => r + 1)} />;
}

function Table({ onRestart }: { onRestart: () => void }) {
  const cards = useRef<Card[]>([]);
  const open = useRef<Card[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const world = useWorld(128, (w) => {
    card ??= buildCard();
    w.spawn({ mesh: "plane", position: [0, 0, -0.3], rotation: quat.x(Math.PI / 2), scale: [11, 1, 9], color: "#1F5A3A" }); // the felt table
    const symbols = [0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
    cards.current = symbols.map((symbol, i) => {
      // The back faces the camera; the face, with its symbol just in front of it, is on the other side.
      const entity = w.spawn({ mesh: card!, position: [((i % 4) - 1.5) * 1.95, (1 - Math.floor(i / 4)) * 2.5, 0] });
      const { shape, color } = SYMBOLS[symbol]!;
      w.spawn({ mesh: shape, parent: entity, position: [0, 0, -0.3], rotation: shape === "torus" ? quat.x(Math.PI / 2) : undefined, scale: 0.65, color, pickable: false });
      return { entity, symbol, open: false, matched: false };
    });
  });

  // Turn a card over around its vertical axis, lifting it a little as it turns.
  const turnOver = (w: World, c: Card) => w.animate(c.entity, { turn: [0, Math.PI, 0] }, { duration: 0.35, easing: "easeInOut" });

  const pickCard = (w: World, c: Card) => {
    if (c.open || c.matched || open.current.length === 2) return;
    c.open = true;
    open.current.push(c);
    void turnOver(w, c);
    if (open.current.length < 2) return;
    setMoves((m) => m + 1);
    const [a, b] = open.current as [Card, Card];
    w.after(0.8, () => {
      if (a.symbol === b.symbol) {
        a.matched = b.matched = true;
        for (const c2 of [a, b]) {
          w.animate(c2.entity, { scale: 1.1 }, { duration: 0.15, yoyo: true, repeat: 1 });
          effects.sparkle(w, { position: w.position(c2.entity) ?? [0, 0, 0], colors: SYMBOLS[c2.symbol]!.color, size: 0.08, speed: 3, count: 14, lifetime: 0.6 });
        }
        if (cards.current.every((c2) => c2.matched)) {
          effects.confetti(w, { position: [0, 0, 1.5], colors: SYMBOLS.map((x) => x.color), size: 0.12, speed: 6, count: 80, lifetime: 1.6, gravity: -6 });
          setWon(true);
        }
      } else for (const c2 of [a, b]) void turnOver(w, c2).then(() => (c2.open = false));
      open.current = [];
    });
  };

  if (!world) return null;
  return (
    <div style={{ flex: 1, display: "flex", position: "relative" }}>
      <GameView
        source={world}
        camera={{ eye: [0, -3.5, 12], target: [0, -0.2, 0], fov: 0.8 }}
        light={frontLight([-0.4, 0.6, 1], 0.5)}
        background="#0F2A1E"
        onTap={(x, y) => {
          const hit = world.pick(x, y);
          const c = cards.current.find((item) => item.entity === hit?.entity);
          if (c) pickCard(world, c);
        }}
        style={{ flex: 1 }}
      />
      <div style={HUD}>
        {won ? \`Solved in \${moves} moves!\` : \`Moves \${moves}\`}
        {won && <button onClick={onRestart} style={BUTTON}>Play again</button>}
      </div>
    </div>
  );
}

const HUD = { position: "absolute" as const, left: 12, top: 12, display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.92)", color: "#0F172A", fontWeight: 700 };
const BUTTON = { padding: "4px 10px", borderRadius: 8, border: "none", background: "#6366F1", color: "white", fontWeight: 600, cursor: "pointer" };
`,
  },
  {
    id: "runner",
    title: "Runner",
    category: "Games",
    code: `import { useRef, useState } from "react";
import { createShape, effects, GameView, merge, shapeGeometry, useWorld, type Entity, type Model, type Vec3 } from "@nayan-ui/engine";

const PLAYER_X = -3;
const GRAVITY = 30;
const JUMP = 11;
// Obstacles: a low crate, a tall crate and a rock, each with its size for collisions.
const OBSTACLES: { size: Vec3; color: string; rock?: boolean }[] = [
  { size: [0.9, 0.9, 0.9], color: "#9C6B3E" },
  { size: [0.8, 1.5, 0.8], color: "#7A4F2A" },
  { size: [1.3, 0.7, 1], color: "#8E8E8E", rock: true },
];

// A runner with eyes, a glossy crate and a tree, built once and reused every round.
let meshes: { hero: Model; crate: Model; tree: Model } | undefined;
const buildMeshes = () => ({
  hero: createShape(
    merge([
      { geometry: shapeGeometry("capsule", { color: [1, 0.7, 0.15] }), scale: [0.8, 0.9, 0.8] },
      { geometry: shapeGeometry("sphere", { color: [1, 1, 1] }), position: [0.28, 0.25, 0.25], scale: 0.2 },
      { geometry: shapeGeometry("sphere", { color: [0.05, 0.05, 0.05] }), position: [0.36, 0.25, 0.27], scale: 0.1 },
    ]),
    { shine: 0.35 },
  ),
  crate: createShape(shapeGeometry("roundedBox"), { shine: 0.2 }),
  tree: createShape(
    merge([
      { geometry: shapeGeometry("cylinder", { color: [0.4, 0.26, 0.15] }), position: [0, 0.6, 0], scale: [0.25, 1.2, 0.25] },
      { geometry: shapeGeometry("cone", { color: [0.2, 0.5, 0.25] }), position: [0, 1.9, 0], scale: [1.3, 2, 1.3] },
    ]),
  ),
});

// Tap to start, then tap to jump the crates and rocks. You score while you survive, and it speeds up.
export default function Runner() {
  const [round, setRound] = useState(0);
  return <Track key={round} onRestart={() => setRound((r) => r + 1)} />;
}

type Thing = { entity: Entity; x: number; z: number; y: number; size?: Vec3 };

function Track({ onRestart }: { onRestart: () => void }) {
  const s = useRef({ hero: null as Entity | null, y: 0, vy: 0, speed: 7, obstacles: [] as Thing[], trees: [] as Thing[], running: false }).current;
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");

  const world = useWorld(96, (w) => {
    const m = (meshes ??= buildMeshes());
    w.spawn({ mesh: "plane", scale: [60, 1, 3], color: "#C8A26B" }); // the dirt track
    w.spawn({ mesh: "plane", position: [0, -0.01, -6], scale: [60, 1, 10], color: "#4F8A3F" }); // grass behind it
    w.spawn({ mesh: "plane", position: [0, -0.01, 6.5], scale: [60, 1, 10], color: "#5C9A49" }); // and in front
    s.hero = w.spawn({ mesh: m.hero, position: [PLAYER_X, 0.5, 0] });
    s.obstacles = [9, 16, 23].map((x, i) => {
      const o = OBSTACLES[i % OBSTACLES.length]!;
      return { entity: w.spawn({ mesh: o.rock ? "sphere" : m.crate, position: [x, o.size[1] / 2, 0], scale: o.size, color: o.color }), x, z: 0, y: o.size[1] / 2, size: o.size };
    });
    // Trees in two rows behind the track; they scroll slower further back (parallax).
    s.trees = Array.from({ length: 10 }, (_, i) => {
      const z = i % 2 ? -3 : -6;
      const x = -12 + i * 3;
      return { entity: w.spawn({ mesh: m.tree, position: [x, 0, z], scale: i % 2 ? 0.8 : 1.1, pickable: false }), x, z, y: 0 };
    });
    w.scoreboard.reset();
    return w.scoreboard.listen({ onScore: (value) => setScore(Math.floor(value)) });
  });

  const start = () => {
    if (!world) return;
    s.running = true;
    setPhase("playing");
    world.scoreboard.startClock(10); // 10 points per second survived
  };

  const jump = () => {
    if (!world || !s.running || s.y > 0 || s.hero === null) return;
    s.vy = JUMP;
    world.animate(s.hero, { scale: [0.85, 1.2, 0.85] }, { duration: 0.12, yoyo: true, repeat: 1 }); // stretch on take-off
  };

  if (!world) return null;
  return (
    <div style={{ flex: 1, display: "flex", position: "relative" }}>
      <GameView
        source={world}
        camera={{ eye: [0, 2.8, 11], target: [0, 1.2, -1], fov: 0.85 }}
        background="#9FD3F5"
        fog={0.025}
        onUpdate={(dt) => {
          if (!s.running || s.hero === null) return;
          // Jump arc; on landing a squash and a puff of dust.
          const wasUp = s.y > 0;
          s.vy -= GRAVITY * dt;
          s.y = Math.max(0, s.y + s.vy * dt);
          if (s.y === 0) {
            s.vy = 0;
            if (wasUp) {
              world.animate(s.hero, { scale: [1.2, 0.8, 1.2] }, { duration: 0.08, yoyo: true, repeat: 1 });
              effects.dust(world, { position: [PLAYER_X, 0.1, 0], color: "rgba(200,162,107,0.8)", size: 0.25, speed: 1.5, count: 8, lifetime: 0.5 });
            }
          }
          world.transforms.position(s.hero, PLAYER_X, 0.5 + s.y, 0);
          s.speed += dt * 0.15;
          // Obstacles come towards the runner and wrap round behind the farthest one.
          const farthest = Math.max(...s.obstacles.map((o) => o.x));
          for (const o of s.obstacles) {
            o.x -= s.speed * dt;
            if (o.x < -12) o.x = Math.max(farthest, 6) + 5 + Math.random() * 6;
            world.transforms.position(o.entity, o.x, o.y, 0);
            const [width, height] = o.size!;
            if (Math.abs(o.x - PLAYER_X) < width / 2 + 0.35 && s.y < height - 0.1) {
              s.running = false;
              world.scoreboard.stop();
              effects.sparks(world, { position: [PLAYER_X, 0.8, 0], colors: ["#FFD54F", "#FF8A65"], size: 0.08, speed: 6, count: 24, lifetime: 0.6 });
              world.animate(s.hero, { turn: [0, 0, Math.PI / 2], moveBy: [-0.5, 0, 0] }, { duration: 0.3 }); // knocked over
              setPhase("over");
            }
          }
          for (const t of s.trees) {
            t.x -= s.speed * dt * (t.z === -3 ? 0.6 : 0.35);
            if (t.x < -16) t.x += 30;
            world.transforms.position(t.entity, t.x, 0, t.z);
          }
        }}
        onTap={() => (phase === "ready" ? start() : jump())}
        style={{ flex: 1 }}
      />
      <div style={HUD}>
        Score {score}
        {phase === "ready" && <span style={{ fontWeight: 500 }}>Tap to start, tap to jump</span>}
        {phase === "over" && <button onClick={onRestart} style={BUTTON}>Play again</button>}
      </div>
    </div>
  );
}

const HUD = { position: "absolute" as const, left: 12, top: 12, display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.92)", color: "#0F172A", fontWeight: 700 };
const BUTTON = { padding: "4px 10px", borderRadius: 8, border: "none", background: "#6366F1", color: "white", fontWeight: 600, cursor: "pointer" };
`,
  },
  {
    id: "procedural-shapes",
    title: "Procedural shapes",
    category: "Basics",
    code: `import { createShape, extrude, GameView, lathe, Path, tube, useWorld } from "@nayan-ui/engine";

// Meshes built in code: a lathed vase, an extruded star and a curved tube.
export default function ProceduralShapes() {
  const world = useWorld(16, (w) => {
    const vase = createShape(lathe([[0, 0], [0.5, 0.1], [0.7, 0.6], [0.35, 1.3], [0.5, 1.7]], { segments: 40, color: [0.9, 0.5, 0.2] }), { shine: 0.4 });
    const star = createShape(extrude(Path.fromSVG("M0 -10 L3 -3 L10 -3 L4.5 1.5 L6.5 9 L0 4.5 L-6.5 9 L-4.5 1.5 L-10 -3 L-3 -3 Z"), { depth: 2, color: [1, 0.8, 0.2] }), { fit: 1.6, shine: 0.6 });
    const curve = createShape(tube([[0, 0, 0], [0.4, 0.8, 0], [1, 1.2, 0.3], [1.6, 1, 0.6]], { radius: (t) => 0.22 * (1 - t * 0.7), color: [0.3, 0.7, 1] }));

    w.spawn({ mesh: "plane", scale: [14, 1, 14], color: "#1E293B" });
    w.spawn({ mesh: vase, position: [-2.6, 0, 0], spin: [0, 0.5, 0] });
    w.spawn({ mesh: star, position: [0, 1.2, 0], spin: [0, 0.8, 0] });
    w.spawn({ mesh: curve, position: [2, 0.2, 0], spin: [0, -0.6, 0] });
  });

  return world && <GameView source={world} camera={{ eye: [0, 3, 8], target: [0, 0.9, 0], fov: 0.9 }} background="#0F172A" style={{ flex: 1 }} />;
}
`,
  },
  {
    id: "load-model",
    title: "Load a 3D model",
    category: "Assets",
    code: `import { useEffect, useState } from "react";
import { GameView, loadModel, useWorld, type Model } from "@nayan-ui/engine";

// A glTF car in three parts: a white body each car paints its own colour, the glass and the trim.
type Car = { body: Model; glass: Model; trim: Model };

export default function LoadModel() {
  const [car, setCar] = useState<Car | null>(null);

  // Load the files once; loadModel starts the engine if it isn't running yet.
  useEffect(() => {
    let active = true;
    Promise.all([
      loadModel("/playground/models/car_body.glb", { center: false, shine: 0.85 }),
      loadModel("/playground/models/car_glass.glb", { center: false, shine: 0.95 }),
      loadModel("/playground/models/car_trim.glb", { center: false, shine: 0.25 }),
    ]).then(([body, glass, trim]) => {
      console.log("car size", body.size);
      if (active) setCar({ body, glass, trim });
    });
    return () => {
      active = false;
    };
  }, []);

  return car ? <Showroom car={car} /> : <p style={{ margin: "auto", color: "#94A3B8" }}>Loading the car…</p>;
}

// Three cars, each an empty root with the parts attached; only the body takes the colour.
function Showroom({ car }: { car: Car }) {
  const world = useWorld(32, (w) => {
    w.spawn({ mesh: "plane", scale: [20, 1, 20], color: "#334155" });
    ["#E53935", "#1E88E5", "#FDD835"].forEach((color, i) => {
      const root = w.spawn({ mesh: "none", position: [(i - 1) * 4.6, 0, 0], spin: [0, 0.4, 0] }); // they turn together, so 4.6 apart clears each car's 4.4 length
      w.spawn({ mesh: car.body, parent: root, color });
      w.spawn({ mesh: car.glass, parent: root });
      w.spawn({ mesh: car.trim, parent: root });
    });
  });
  return world && <GameView source={world} camera={{ eye: [0, 4.5, 13], target: [0, 0.7, 0], fov: 0.9 }} background="#0F172A" style={{ flex: 1 }} />;
}
`,
  },
  {
    id: "animated-character",
    title: "Animated character",
    category: "Assets",
    code: `import { useEffect, useRef, useState } from "react";
import { GameView, loadModel, loadTexture, useWorld, type Entity, type LoadedModel, type Texture } from "@nayan-ui/engine";

const CLIPS = ["idle", "walk", "run", "celebrate"];
type Hero = { model: LoadedModel; atlas: Texture };

// A rigged glTF character with its skeletal clips. Pick a clip to crossfade to it.
export default function AnimatedCharacter() {
  const [hero, setHero] = useState<Hero | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadModel("/playground/models/explorer.glb", { center: false, fit: 2, shine: 0.05 }),
      loadTexture("/playground/textures/explorer-atlas.png"),
    ]).then(([model, atlas]) => {
      console.log(model.jointCount, "joints; clips:", model.animations.map((clip) => clip.name).join(", "));
      if (active) setHero({ model, atlas });
    });
    return () => {
      active = false;
    };
  }, []);

  return hero ? <Stage hero={hero} /> : <p style={{ margin: "auto", color: "#94A3B8" }}>Loading the character…</p>;
}

function Stage({ hero }: { hero: Hero }) {
  const body = useRef<Entity | null>(null);
  const world = useWorld(16, (w) => {
    w.spawn({ mesh: "plane", scale: [12, 1, 12], color: "#3F6B3F" });
    body.current = w.spawn({ mesh: hero.model, texture: hero.atlas });
    w.playClip(body.current, "idle");
  });

  if (!world) return null;
  return (
    <div style={{ flex: 1, display: "flex", position: "relative" }}>
      <GameView source={world} camera={{ eye: [0, 1.6, 4.2], target: [0, 1, 0], fov: 0.9 }} background="#BFE3FF" style={{ flex: 1 }} />
      <div style={{ position: "absolute", left: 12, top: 12, display: "flex", gap: 8 }}>
        {CLIPS.map((clip) => (
          <button key={clip} onClick={() => body.current !== null && world.playClip(body.current, clip, { fade: 0.25 })} style={BUTTON}>
            {clip}
          </button>
        ))}
      </div>
    </div>
  );
}

// Dark text on white: the page around the preview can be in dark mode, where text defaults to white.
const BUTTON = { padding: "6px 12px", borderRadius: 8, border: "none", background: "white", color: "#0F172A", fontWeight: 600, cursor: "pointer" };
`,
  },
  {
    id: "textures",
    title: "Textures",
    category: "Assets",
    code: `import { useEffect, useState } from "react";
import { GameView, loadTexture, useWorld, type Texture } from "@nayan-ui/engine";

const FILES = ["asphalt.png", "grass.png", "bark.jpg"];

// Images drawn on meshes. A textured entity usually keeps color "white" so the image shows as it is.
export default function Textures() {
  const [textures, setTextures] = useState<Texture[] | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all(FILES.map((file) => loadTexture(\`/playground/textures/\${file}\`))).then((loaded) => active && setTextures(loaded));
    return () => {
      active = false;
    };
  }, []);

  return textures ? <Scene textures={textures} /> : <p style={{ margin: "auto", color: "#94A3B8" }}>Loading the textures…</p>;
}

function Scene({ textures }: { textures: Texture[] }) {
  const world = useWorld(16, (w) => {
    w.spawn({ mesh: "plane", scale: [14, 1, 14], texture: textures[1], color: "white" });
    textures.forEach((texture, i) => {
      w.spawn({ mesh: i === 1 ? "sphere" : "cube", texture, color: "white", position: [(i - 1) * 2.4, 1.2, 0], scale: 1.4, spin: [0.3, 0.6, 0] });
    });
  });
  return world && <GameView source={world} camera={{ eye: [0, 3, 7], target: [0, 1, 0], fov: 1 }} background="#BFE3FF" style={{ flex: 1 }} />;
}
`,
  },
  {
    id: "sound-and-music",
    title: "Sound and music",
    category: "Assets",
    code: `import { useEffect, useMemo, useRef, useState } from "react";
import { audio, GameView, useWorld, type Entity, type Voice } from "@nayan-ui/engine";

// Tap the ball to bounce it with a sound; the button plays looping music.
export default function SoundAndMusic() {
  // One bank of named sounds, decoded by the engine's mixer. Plays are ignored until it's ready.
  const sounds = useMemo(
    () => audio.load({ coin: "/playground/sounds/coin.wav", jump: "/playground/sounds/jump.wav", music: "/playground/sounds/music.wav" }),
    [],
  );
  const music = useRef<Voice | null>(null);
  const [playing, setPlaying] = useState(false);
  const ball = useRef<Entity | null>(null);

  // Stop the music when the example closes.
  useEffect(() => () => audio.stop(music.current), []);

  const world = useWorld(32, (w) => {
    w.spawn({ mesh: "plane", scale: [20, 1, 20], color: "#4C9A4C", physics: "fixed" });
    ball.current = w.spawn({ mesh: "sphere", position: [0, 3, 0], color: "#FFB400", physics: { type: "dynamic", bounce: 0.5 } });
  });

  const toggleMusic = () => {
    if (playing) audio.stop(music.current);
    else music.current = sounds.play("music", { volume: 0.4, loop: true });
    setPlaying(!playing);
  };

  if (!world) return null;
  return (
    <div style={{ flex: 1, display: "flex", position: "relative" }}>
      <GameView
        source={world}
        camera={{ eye: [0, 4, 8], target: [0, 0.5, 0], fov: 1 }}
        background="#BFE3FF"
        onTap={(x, y) => {
          if (ball.current === null || world.pick(x, y)?.entity !== ball.current) return;
          world.impulse(ball.current, [0, 5, 0]);
          sounds.play("jump", { volume: 0.8 });
        }}
        style={{ flex: 1 }}
      />
      <div style={{ position: "absolute", left: 12, top: 12, display: "flex", gap: 8 }}>
        <button onClick={() => sounds.play("coin")} style={BUTTON}>Coin</button>
        <button onClick={toggleMusic} style={BUTTON}>{playing ? "Stop music" : "Play music"}</button>
      </div>
    </div>
  );
}

// Dark text on white: the page around the preview can be in dark mode, where text defaults to white.
const BUTTON = { padding: "6px 12px", borderRadius: 8, border: "none", background: "white", color: "#0F172A", fontWeight: 600, cursor: "pointer" };
`,
  },
  {
    id: "text-and-fonts",
    title: "3D text and fonts",
    category: "Assets",
    code: `import { useEffect, useRef, useState } from "react";
import { GameView, loadFont, useWorld, type Entity, type Font } from "@nayan-ui/engine";

// A TrueType font turned into 3D letters, and a score that counts your taps.
export default function TextAndFonts() {
  const [font, setFont] = useState<Font | null>(null);

  useEffect(() => {
    let active = true;
    loadFont("/playground/fonts/Inter-SemiBold.ttf", { depth: 0.25 }).then((loaded) => active && setFont(loaded));
    return () => {
      active = false;
    };
  }, []);

  return font ? <Title font={font} /> : <p style={{ margin: "auto", color: "#94A3B8" }}>Loading the font…</p>;
}

function Title({ font }: { font: Font }) {
  const score = useRef<{ label: Entity | null; value: number }>({ label: null, value: 0 });
  const world = useWorld(256, (w) => {
    w.spawn({ text: "Nayan Engine", font, position: [0, 1, 0], scale: 0.9, color: "#FFB400", spin: [0, 0.4, 0] });
    // tabular: every digit is as wide as the widest, so the number doesn't jitter as it changes.
    score.current.label = w.spawn({ text: "Taps: 0", font, tabular: true, position: [0, -0.8, 0], scale: 0.5, color: "white" });
  });

  return (
    world && (
      <GameView
        source={world}
        camera={{ eye: [0, 0, 7], target: [0, 0.2, 0], fov: 1 }}
        background="#14213D"
        onTap={() => {
          const s = score.current;
          if (s.label !== null) world.set(s.label, { text: \`Taps: \${++s.value}\` });
        }}
        style={{ flex: 1 }}
      />
    )
  );
}
`,
  },
  {
    id: "drag-to-steer",
    title: "Drag to steer",
    category: "Input",
    code: `import { useRef } from "react";
import { GameView, useWorld, type Entity } from "@nayan-ui/engine";

// Drag left or right to steer the box between the road's edges.
export default function DragToSteer() {
  const player = useRef<{ box: Entity | null; x: number; from: number }>({ box: null, x: 0, from: 0 });
  const world = useWorld(16, (w) => {
    w.spawn({ mesh: "plane", scale: [8, 1, 40], color: "#2B2B2B" });
    for (const x of [-4, 4]) w.spawn({ mesh: "cube", position: [x, 0.2, 0], scale: [0.2, 0.4, 40], color: "#E5E7EB" });
    player.current.box = w.spawn({ mesh: "roundedBox", position: [0, 0.5, 2], color: "#E53935" });
  });

  return (
    world && (
      <GameView
        source={world}
        camera={{ eye: [0, 5, 9], target: [0, 0, -2], fov: 1 }}
        background="#BFE3FF"
        onDrag={({ phase, dx }) => {
          const p = player.current;
          if (p.box === null) return;
          if (phase === "start") p.from = p.x;
          p.x = Math.max(-3.2, Math.min(3.2, p.from + dx / 60)); // 60 points of drag = 1 unit
          world.transforms.position(p.box, p.x, 0.5, 2);
        }}
        style={{ flex: 1 }}
      />
    )
  );
}
`,
  },
  {
    id: "physics-tower",
    title: "Physics tower",
    category: "Effects and physics",
    code: `import { GameView, useWorld } from "@nayan-ui/engine";

// A tower of dynamic blocks. Tap to drop a heavy ball on it.
export default function PhysicsTower() {
  const world = useWorld(256, (w) => {
    w.spawn({ mesh: "plane", scale: [30, 1, 30], color: "#4C9A4C", physics: "fixed" });
    for (let level = 0; level < 8; level++)
      for (let i = 0; i < 3; i++)
        w.spawn({
          mesh: "cube",
          position: [(i - 1) * 1.05, 0.5 + level * 1.02, 0],
          color: level % 2 ? "#FFB400" : "#3399FF",
          physics: { type: "dynamic", friction: 0.8 },
        });
  });

  return (
    world && (
      <GameView
        source={world}
        camera={{ eye: [0, 5, 14], target: [0, 3, 0], fov: 1 }}
        background="#BFE3FF"
        onTap={() =>
          world.spawn({ mesh: "sphere", position: [(Math.random() - 0.5) * 2, 12, 0], scale: 1.2, color: "#E53935", physics: { type: "dynamic", shape: "ball", density: 8 }, lifetime: 10 })
        }
        style={{ flex: 1 }}
      />
    )
  );
}
`,
  },
];
