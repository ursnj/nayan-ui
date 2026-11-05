// Standalone React programs rendered by the playground preview.
export interface PlaygroundExample {
  id: string;
  title: string;
  category: "Basics" | "Games" | "Assets" | "Input" | "Effects and physics";
  description: string;
  instruction: string;
  code: string;
}

export const PLAYGROUND_CATEGORIES: PlaygroundExample["category"][] = [
  "Basics",
  "Games",
  "Assets",
  "Input",
  "Effects and physics",
];

export const PLAYGROUND_EXAMPLES: PlaygroundExample[] = [
  {
    id: "first-scene",
    title: "First scene",
    category: "Basics",
    description: "Create a world with a floor, a shape and a camera.",
    instruction: "Change the cube’s color, size or rotation speed.",
    code: `// Create a world with a floor, a shape and a camera.
// Change the cube’s color, size or rotation speed.

import { GameView, useWorld } from "@nayan-ui/engine";

// Create a world, add a floor and a cube, then render them with a camera.
export default function FirstScene() {
  const world = useWorld(8, (scene) => {
    scene.spawn({ mesh: "plane", scale: [12, 1, 12], color: "#1E293B" });
    scene.spawn({
      mesh: "roundedBox",
      position: [0, 0.75, 0],
      scale: 1.5,
      color: "#818CF8",
      spin: [0, 0.5, 0],
    });
  });

  return (
    world && (
      <GameView
        source={world}
        camera={{ eye: [4, 3, 6], target: [0, 0.5, 0], fov: 0.85 }}
        background="#0F172A"
        style={{ flex: 1 }}
      />
    )
  );
}
`,
  },
  {
    id: "bouncing-ball",
    title: "Bouncing ball",
    category: "Basics",
    description: "Add a dynamic body and apply an impulse.",
    instruction: "Tap to bounce the ball.",
    code: `// Add a dynamic body and apply an impulse.
// Tap to bounce the ball.

import { useRef } from "react";
import { GameView, useWorld, type Entity } from "@nayan-ui/engine";

// A ground plane and a ball with physics. Tap to throw the ball up again.
export default function BouncingBall() {
  const ball = useRef<Entity | null>(null);
  const world = useWorld(100, (w) => {
    w.spawn({ mesh: "plane", scale: [20, 1, 20], color: "#1E293B", physics: "fixed" });
    ball.current = w.spawn({
      mesh: "sphere",
      position: [0, 5, 0],
      color: "#38BDF8",
      physics: { type: "dynamic", bounce: 0.6 },
    });
  });

  return (
    world && (
      <GameView
        source={world}
        camera={{ eye: [0, 4, 8], target: [0, 0, 0], fov: 1 }}
        background="#0F172A"
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
    title: "Pick and remove",
    category: "Input",
    description: "Find an entity at the pointer and remove it with an effect.",
    instruction: "Tap each cube to clear the row.",
    code: `// Find an entity at the pointer and remove it with an effect.
// Tap each cube to clear the row.

import { useRef } from "react";
import { effects, GameView, useWorld, type Entity, type World } from "@nayan-ui/engine";

const COLORS = ["#818CF8", "#2DD4BF", "#FBBF24", "#38BDF8", "#FB7185"];

// Five spinning cubes in a row.
function fill(world: World, cubes: Set<Entity>) {
  cubes.clear();
  COLORS.forEach((color, i) =>
    cubes.add(
      world.spawn({ mesh: "cube", position: [(i - 2) * 1.6, 0, 0], color, spin: [0.4, 0.8, 0] }),
    ),
  );
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
        background="#0F172A"
        onTap={(x, y) => {
          const hit = world.pick(x, y);
          if (!hit || !cubes.delete(hit.entity)) return;
          const piece = hit.entity;
          effects.sparkle(world, {
            position: hit.point,
            colors: "#2DD4BF",
            size: 0.08,
            speed: 3,
            count: 14,
            lifetime: 0.6,
          });
          void effects.pop(world, piece, { scale: 1 }).then(() => world.despawn(piece));
          if (cubes.size === 0) world.after(0.8, () => fill(world, cubes));
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
    title: "Frame updates",
    category: "Basics",
    description: "Move an entity with elapsed time, without React renders.",
    instruction: "Change the radius or speed in onUpdate.",
    code: `// Move an entity with elapsed time, without React renders.
// Change the radius or speed in onUpdate.

import { useRef } from "react";
import { GameView, useWorld, type Entity } from "@nayan-ui/engine";

// onUpdate runs every frame: move a box in a circle without React state.
export default function GameLoop() {
  const box = useRef<Entity | null>(null);
  const time = useRef(0);
  const world = useWorld(16, (w) => {
    w.spawn({ mesh: "plane", scale: [12, 1, 12], color: "#1E293B" });
    box.current = w.spawn({ mesh: "roundedBox", position: [3, 0.5, 0], color: "#818CF8" });
  });

  return (
    world && (
      <GameView
        source={world}
        camera={{ eye: [0, 7, 8], target: [0, 0, 0], fov: 1 }}
        background="#0F172A"
        onUpdate={(dt) => {
          time.current += dt;
          if (box.current !== null)
            world.transforms.position(
              box.current,
              Math.cos(time.current) * 3,
              0.5,
              Math.sin(time.current) * 3,
            );
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
    title: "Particle burst",
    category: "Effects and physics",
    description: "Create a short-lived particle effect on demand.",
    instruction: "Tap to release confetti.",
    code: `// Create a short-lived particle effect on demand.
// Tap to release confetti.

import { effects, GameView, useWorld } from "@nayan-ui/engine";

// Tap anywhere to celebrate.
export default function Confetti() {
  const world = useWorld(512, (w) => {
    w.spawn({ mesh: "torus", position: [0, 0, 0], color: "#818CF8", spin: [0.5, 1, 0] });
  });

  return (
    world && (
      <GameView
        source={world}
        camera={{ eye: [0, 0, 7], target: [0, 0, 0], fov: 1 }}
        background="#0F172A"
        onTap={() =>
          effects.confetti(world, {
            position: [0, 1, 0],
            colors: ["#818CF8", "#2DD4BF", "#38BDF8"],
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
    description: "Build a two-player board with picking and turn state.",
    instruction: "Take turns tapping an empty square. Three in a row wins.",
    code: `// Build a two-player board with picking and turn state.
// Take turns tapping an empty square. Three in a row wins.

import { useRef, useState } from "react";
import { GameView, quat, useWorld, type Entity } from "@nayan-ui/engine";

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export default function TicTacToe() {
  const [round, setRound] = useState(0);
  return <Board key={round} onRestart={() => setRound((value) => value + 1)} />;
}

function Board({ onRestart }: { onRestart: () => void }) {
  const tiles = useRef<Entity[]>([]);
  const marks = useRef<string[]>(Array(9).fill(""));
  const turn = useRef("X");
  const finished = useRef(false);
  const [status, setStatus] = useState("X's turn");
  const world = useWorld(40, (scene) => {
    tiles.current = Array.from({ length: 9 }, (_, index) =>
      scene.spawn({
        mesh: "roundedBox",
        color: "#334155",
        position: [((index % 3) - 1) * 1.8, (1 - Math.floor(index / 3)) * 1.8, 0],
        scale: [1.65, 1.65, 0.15],
      }),
    );
  });

  if (!world) return null;
  return (
    <div style={{ display: "flex", flex: 1, position: "relative" }}>
      <GameView
        source={world}
        background="#0F172A"
        camera={{ eye: [0, 0, 9], target: [0, 0, 0], fov: 0.8 }}
        onTap={(x, y) => {
          const hit = world.pick(x, y);
          const index = hit ? tiles.current.indexOf(hit.entity) : -1;
          if (finished.current || index < 0 || marks.current[index]) return;
          const mark = turn.current;
          marks.current[index] = mark;
          const position: [number, number, number] = [
            ((index % 3) - 1) * 1.8,
            (1 - Math.floor(index / 3)) * 1.8,
            0.25,
          ];
          // Pieces are decorative; picking always reaches the tile underneath.
          if (mark === "X") {
            for (const angle of [-Math.PI / 4, Math.PI / 4]) {
              world.spawn({
                mesh: "roundedBox",
                position,
                rotation: quat.z(angle),
                scale: [1.1, 0.2, 0.2],
                color: "#818CF8",
                pickable: false,
              });
            }
          } else {
            world.spawn({
              mesh: "torus",
              position,
              rotation: quat.x(Math.PI / 2),
              scale: 0.9,
              color: "#2DD4BF",
              pickable: false,
            });
          }
          const won = LINES.some((line) => line.every((cell) => marks.current[cell] === mark));
          finished.current = won || marks.current.every(Boolean);
          turn.current = mark === "X" ? "O" : "X";
          setStatus(won ? mark + " wins" : finished.current ? "Draw" : turn.current + "'s turn");
        }}
        style={{ flex: 1 }}
      />
      <div style={HUD}>
        <span role="status">{status}</span>
        <button type="button" onClick={onRestart} style={BUTTON}>
          New round
        </button>
      </div>
    </div>
  );
}

const HUD = {
  position: "absolute" as const,
  top: 16,
  left: 16,
  right: 16,
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "10px 14px",
  border: "1px solid #334155",
  borderRadius: 12,
  background: "#0F172AEE",
  color: "#E2E8F0",
  fontSize: 14,
  fontWeight: 500,
};
const BUTTON = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid #475569",
  background: "#1E293B",
  color: "#F8FAFC",
  font: "inherit",
  cursor: "pointer",
};
`,
  },
  {
    id: "whack-a-mole",
    title: "Whack-a-mole",
    category: "Games",
    description: "Combine picking, a countdown and a React score display.",
    instruction: "Tap the teal target. Score as many hits as you can in 20 seconds.",
    code: `// Combine picking, a countdown and a React score display.
// Tap the teal target. Score as many hits as you can in 20 seconds.

import { useRef, useState } from "react";
import { GameView, useWorld, type Entity } from "@nayan-ui/engine";

const position = (index: number): [number, number, number] => [
  ((index % 3) - 1) * 2,
  0.6,
  (Math.floor(index / 3) - 1) * 2,
];

export default function WhackAMole() {
  const [round, setRound] = useState(0);
  return <Garden key={round} onRestart={() => setRound((value) => value + 1)} />;
}

function Garden({ onRestart }: { onRestart: () => void }) {
  const target = useRef<Entity | null>(null);
  const slot = useRef(4);
  const hits = useRef(0);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(20);
  const world = useWorld(24, (scene) => {
    scene.spawn({ mesh: "plane", scale: [20, 1, 20], color: "#1E293B", pickable: false });
    for (let index = 0; index < 9; index++) {
      const [x, , z] = position(index);
      scene.spawn({
        mesh: "cylinder",
        position: [x, 0.05, z],
        scale: [1.4, 0.1, 1.4],
        color: "#475569",
        pickable: false,
      });
    }
    target.current = scene.spawn({
      mesh: "capsule",
      position: position(slot.current),
      scale: [0.7, 0.9, 0.7],
      color: "#2DD4BF",
    });
    scene.scoreboard.reset(0, 20);
    const unsubscribe = scene.scoreboard.listen({ onSecond: setSeconds });
    scene.scoreboard.resume();
    return unsubscribe;
  });

  if (!world) return null;
  return (
    <div style={{ display: "flex", flex: 1, position: "relative" }}>
      <GameView
        source={world}
        background="#0F172A"
        camera={{ eye: [0, 7, 8], target: [0, 0, 0], fov: 0.85 }}
        onTap={(x, y) => {
          if (
            seconds === 0 ||
            target.current === null ||
            world.pick(x, y)?.entity !== target.current
          )
            return;
          // Choose a different hole after each hit; no overlapping timers or animations.
          slot.current = (slot.current + 1 + Math.floor(Math.random() * 8)) % 9;
          world.set(target.current, { position: position(slot.current) });
          setScore(++hits.current);
        }}
        style={{ flex: 1 }}
      />
      <div style={HUD}>
        <span role="status">
          {seconds > 0 ? seconds + "s · " + score + " hits" : "Time up · " + score + " hits"}
        </span>
        <button type="button" onClick={onRestart} style={BUTTON}>
          Restart
        </button>
      </div>
    </div>
  );
}

const HUD = {
  position: "absolute" as const,
  top: 16,
  left: 16,
  right: 16,
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "10px 14px",
  border: "1px solid #334155",
  borderRadius: 12,
  background: "#0F172AEE",
  color: "#E2E8F0",
  fontSize: 14,
  fontWeight: 500,
};
const BUTTON = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid #475569",
  background: "#1E293B",
  color: "#F8FAFC",
  font: "inherit",
  cursor: "pointer",
};
`,
  },
  {
    id: "stack-tower",
    title: "Stack tower",
    category: "Games",
    description: "Use frame updates and overlap checks to stack blocks.",
    instruction: "Tap to place the moving block. Stack 10 to finish.",
    code: `// Use frame updates and overlap checks to stack blocks.
// Tap to place the moving block. Stack 10 to finish.

import { useRef, useState } from "react";
import { GameView, useWorld, type Camera, type Entity } from "@nayan-ui/engine";

const COLORS = ["#818CF8", "#2DD4BF", "#38BDF8", "#C084FC"];
const GOAL = 10;

export default function StackTower() {
  const [round, setRound] = useState(0);
  return <Tower key={round} onRestart={() => setRound((value) => value + 1)} />;
}

function Tower({ onRestart }: { onRestart: () => void }) {
  const camera = useRef<Camera>({ eye: [7, 6, 9], target: [0, 1, 0], fov: 0.85 }).current;
  const state = useRef({
    block: null as Entity | null,
    x: 0,
    center: 0,
    width: 3,
    level: 1,
    time: 0,
    over: false,
  }).current;
  const [status, setStatus] = useState("Stack 10 blocks");
  const world = useWorld(24, (scene) => {
    scene.spawn({ mesh: "cube", position: [0, -0.25, 0], scale: [3, 0.5, 3], color: "#475569" });
    state.block = scene.spawn({
      mesh: "cube",
      position: [0, 0.25, 0],
      scale: [3, 0.5, 3],
      color: COLORS[0],
    });
  });

  if (!world) return null;
  return (
    <div style={{ display: "flex", flex: 1, position: "relative" }}>
      <GameView
        source={world}
        camera={camera}
        background="#0F172A"
        onUpdate={(dt) => {
          if (state.over || state.block === null) return;
          state.time += dt;
          state.x = Math.sin(state.time * 1.8) * 3.5;
          world.transforms.position(state.block, state.x, (state.level - 0.5) * 0.5, 0);
          camera.target[1] = state.level * 0.25;
          camera.eye[1] = camera.target[1] + 5;
        }}
        onTap={() => {
          if (state.over || state.block === null) return;
          const offset = state.x - state.center;
          const overlap = state.width - Math.abs(offset);
          if (overlap <= 0) {
            state.over = true;
            setStatus("Missed · " + (state.level - 1) + " stacked");
            return;
          }
          state.center += offset / 2;
          state.width = overlap;
          world.set(state.block, {
            position: [state.center, (state.level - 0.5) * 0.5, 0],
            scale: [overlap, 0.5, 3],
          });
          if (state.level === GOAL) {
            state.over = true;
            setStatus("Complete · 10 blocks stacked");
            return;
          }
          setStatus(state.level + " / " + GOAL + " stacked");
          state.level++;
          state.block = world.spawn({
            mesh: "cube",
            position: [state.x, (state.level - 0.5) * 0.5, 0],
            scale: [overlap, 0.5, 3],
            color: COLORS[(state.level - 1) % COLORS.length],
          });
        }}
        style={{ flex: 1 }}
      />
      <div style={HUD}>
        <span role="status">{status}</span>
        <button type="button" onClick={onRestart} style={BUTTON}>
          Restart
        </button>
      </div>
    </div>
  );
}

const HUD = {
  position: "absolute" as const,
  top: 16,
  left: 16,
  right: 16,
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "10px 14px",
  border: "1px solid #334155",
  borderRadius: 12,
  background: "#0F172AEE",
  color: "#E2E8F0",
  fontSize: 14,
  fontWeight: 500,
};
const BUTTON = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid #475569",
  background: "#1E293B",
  color: "#F8FAFC",
  font: "inherit",
  cursor: "pointer",
};
`,
  },
  {
    id: "memory-match",
    title: "Memory match",
    category: "Games",
    description: "Reveal shapes and compare pairs using an engine timer.",
    instruction: "Tap two cards. Match all four pairs.",
    code: `// Reveal shapes and compare pairs using an engine timer.
// Tap two cards. Match all four pairs.

import { useRef, useState } from "react";
import { GameView, useWorld, type Entity, type Shape } from "@nayan-ui/engine";

type Card = { tile: Entity; symbol: Entity; pair: number; matched: boolean };
const SHAPES: Shape[] = ["sphere", "cube", "cone", "capsule"];
const COLORS = ["#818CF8", "#2DD4BF", "#FBBF24", "#FB7185"];

export default function MemoryMatch() {
  const [round, setRound] = useState(0);
  return <Cards key={round} onRestart={() => setRound((value) => value + 1)} />;
}

function Cards({ onRestart }: { onRestart: () => void }) {
  const cards = useRef<Card[]>([]);
  const open = useRef<Card[]>([]);
  const pairs = useRef(0);
  const attempts = useRef(0);
  const [status, setStatus] = useState("Find four pairs");
  const world = useWorld(32, (scene) => {
    const deck = [0, 1, 2, 3, 0, 1, 2, 3];
    // Fisher–Yates gives every card order the same chance.
    for (let index = deck.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [deck[index], deck[other]] = [deck[other], deck[index]];
    }
    cards.current = deck.map((pair, index) => {
      const x = ((index % 4) - 1.5) * 1.8;
      const y = index < 4 ? 1 : -1;
      const tile = scene.spawn({
        mesh: "roundedBox",
        position: [x, y, 0],
        scale: [1.6, 1.8, 0.15],
        color: "#334155",
      });
      const symbol = scene.spawn({
        mesh: SHAPES[pair],
        position: [x, y, 0.4],
        scale: 0,
        color: COLORS[pair],
        pickable: false,
      });
      return { tile, symbol, pair, matched: false };
    });
  });

  if (!world) return null;
  return (
    <div style={{ display: "flex", flex: 1, position: "relative" }}>
      <GameView
        source={world}
        background="#0F172A"
        camera={{ eye: [0, 0, 10], target: [0, 0, 0], fov: 0.85 }}
        onTap={(x, y) => {
          const hit = world.pick(x, y);
          const card = cards.current.find((item) => item.tile === hit?.entity);
          if (!card || card.matched || open.current.includes(card) || open.current.length === 2)
            return;
          world.set(card.symbol, { scale: 0.7 });
          open.current.push(card);
          if (open.current.length < 2) return;
          attempts.current++;
          const [first, second] = open.current;
          // Engine timers are disposed with the world when switching examples.
          world.after(0.7, () => {
            if (first.pair === second.pair) {
              first.matched = second.matched = true;
              pairs.current++;
              for (const item of open.current) world.set(item.tile, { color: "#0F766E" });
            } else {
              for (const item of open.current) world.set(item.symbol, { scale: 0 });
            }
            open.current = [];
            setStatus(
              pairs.current === 4
                ? "Complete · " + attempts.current + " turns"
                : pairs.current + " / 4 pairs · " + attempts.current + " turns",
            );
          });
        }}
        style={{ flex: 1 }}
      />
      <div style={HUD}>
        <span role="status">{status}</span>
        <button type="button" onClick={onRestart} style={BUTTON}>
          New round
        </button>
      </div>
    </div>
  );
}

const HUD = {
  position: "absolute" as const,
  top: 16,
  left: 16,
  right: 16,
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "10px 14px",
  border: "1px solid #334155",
  borderRadius: 12,
  background: "#0F172AEE",
  color: "#E2E8F0",
  fontSize: 14,
  fontWeight: 500,
};
const BUTTON = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid #475569",
  background: "#1E293B",
  color: "#F8FAFC",
  font: "inherit",
  cursor: "pointer",
};
`,
  },
  {
    id: "runner",
    title: "Jump runner",
    category: "Games",
    description: "Build a jump arc and a simple collision check.",
    instruction: "Tap to jump over the teal obstacle.",
    code: `// Build a jump arc and a simple collision check.
// Tap to jump over the teal obstacle.

import { useRef, useState } from "react";
import { GameView, useWorld, type Entity } from "@nayan-ui/engine";

export default function Runner() {
  const [round, setRound] = useState(0);
  return <Track key={round} onRestart={() => setRound((value) => value + 1)} />;
}

function Track({ onRestart }: { onRestart: () => void }) {
  const state = useRef({
    hero: null as Entity | null,
    obstacle: null as Entity | null,
    y: 0,
    velocity: 0,
    x: 7,
    score: 0,
    over: false,
  }).current;
  const [status, setStatus] = useState("Tap to jump");
  const world = useWorld(16, (scene) => {
    scene.spawn({ mesh: "plane", scale: [40, 1, 6], color: "#334155" });
    state.hero = scene.spawn({ mesh: "roundedBox", position: [-2, 0.5, 0], color: "#818CF8" });
    state.obstacle = scene.spawn({
      mesh: "cube",
      position: [7, 0.5, 0],
      scale: [0.7, 1, 1],
      color: "#2DD4BF",
    });
  });

  if (!world) return null;
  return (
    <div style={{ display: "flex", flex: 1, position: "relative" }}>
      <GameView
        source={world}
        background="#0F172A"
        camera={{ eye: [0, 3, 12], target: [0, 1, 0], fov: 0.8 }}
        onTap={() => {
          if (!state.over && state.y === 0) state.velocity = 7;
        }}
        onUpdate={(dt) => {
          if (state.over || state.hero === null || state.obstacle === null) return;
          // Integrate a simple jump arc and move one reusable obstacle.
          state.velocity -= 18 * dt;
          state.y = Math.max(0, state.y + state.velocity * dt);
          if (state.y === 0) state.velocity = 0;
          state.x -= 4 * dt;
          world.transforms.position(state.hero, -2, 0.5 + state.y, 0);
          if (Math.abs(state.x + 2) < 0.8 && state.y < 0.95) {
            state.over = true;
            setStatus("Game over · " + state.score + " cleared");
          }
          if (state.x < -6) {
            state.x = 7;
            state.score++;
            setStatus(state.score + " cleared");
          }
          world.transforms.position(state.obstacle, state.x, 0.5, 0);
        }}
        style={{ flex: 1 }}
      />
      <div style={HUD}>
        <span role="status">{status}</span>
        <button type="button" onClick={onRestart} style={BUTTON}>
          Restart
        </button>
      </div>
    </div>
  );
}

const HUD = {
  position: "absolute" as const,
  top: 16,
  left: 16,
  right: 16,
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "10px 14px",
  border: "1px solid #334155",
  borderRadius: 12,
  background: "#0F172AEE",
  color: "#E2E8F0",
  fontSize: 14,
  fontWeight: 500,
};
const BUTTON = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid #475569",
  background: "#1E293B",
  color: "#F8FAFC",
  font: "inherit",
  cursor: "pointer",
};
`,
  },
  {
    id: "procedural-shapes",
    title: "Procedural geometry",
    category: "Basics",
    description: "Build meshes with a profile, an outline and a path.",
    instruction: "Edit the vase profile, star outline or tube path.",
    code: `// Build meshes with a profile, an outline and a path.
// Edit the vase profile, star outline or tube path.

import { createShape, extrude, GameView, lathe, Path, tube, useWorld } from "@nayan-ui/engine";

// Meshes built in code: a lathed vase, an extruded star and a curved tube.
export default function ProceduralShapes() {
  const world = useWorld(16, (w) => {
    const vase = createShape(
      lathe(
        [
          [0, 0],
          [0.5, 0.1],
          [0.7, 0.6],
          [0.35, 1.3],
          [0.5, 1.7],
        ],
        { segments: 40, color: [0.9, 0.5, 0.2] },
      ),
      { shine: 0.4 },
    );
    const star = createShape(
      extrude(
        Path.fromSVG(
          "M0 -10 L3 -3 L10 -3 L4.5 1.5 L6.5 9 L0 4.5 L-6.5 9 L-4.5 1.5 L-10 -3 L-3 -3 Z",
        ),
        { depth: 2, color: [1, 0.8, 0.2] },
      ),
      { fit: 1.6, shine: 0.6 },
    );
    const curve = createShape(
      tube(
        [
          [0, 0, 0],
          [0.4, 0.8, 0],
          [1, 1.2, 0.3],
          [1.6, 1, 0.6],
        ],
        { radius: (t) => 0.22 * (1 - t * 0.7), color: [0.3, 0.7, 1] },
      ),
    );

    w.spawn({ mesh: "plane", scale: [14, 1, 14], color: "#1E293B" });
    w.spawn({ mesh: vase, position: [-2.6, 0, 0], spin: [0, 0.5, 0] });
    w.spawn({ mesh: star, position: [0, 1.2, 0], spin: [0, 0.8, 0] });
    w.spawn({ mesh: curve, position: [2, 0.2, 0], spin: [0, -0.6, 0] });
  });

  return (
    world && (
      <GameView
        source={world}
        camera={{ eye: [0, 3, 8], target: [0, 0.9, 0], fov: 0.9 }}
        background="#0F172A"
        style={{ flex: 1 }}
      />
    )
  );
}
`,
  },
  {
    id: "load-model",
    title: "Model showroom",
    category: "Assets",
    description: "Load glTF parts and attach them to a shared parent.",
    instruction: "Change the body colors to customize the three cars.",
    code: `// Load glTF parts and attach them to a shared parent.
// Change the body colors to customize the three cars.

import { useEffect, useState } from "react";
import { GameView, loadModel, useWorld, type Model } from "@nayan-ui/engine";

// A glTF car in three parts: a white body each car paints its own colour, the glass and the trim.
type Car = { body: Model; glass: Model; trim: Model };

export default function LoadModel() {
  const [error, setError] = useState<string | null>(null);
  const [car, setCar] = useState<Car | null>(null);

  // Load the files once; loadModel starts the engine if it isn't running yet.
  useEffect(() => {
    let active = true;
    Promise.all([
      loadModel("/playground/models/car_body.glb", { center: false, shine: 0.85 }),
      loadModel("/playground/models/car_glass.glb", { center: false, shine: 0.95 }),
      loadModel("/playground/models/car_trim.glb", { center: false, shine: 0.25 }),
    ])
      .then(([body, glass, trim]) => {
        if (active) setCar({ body, glass, trim });
      })
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : String(failure));
      });
    return () => {
      active = false;
    };
  }, []);

  if (error)
    return (
      <p role="alert" style={{ margin: "auto", padding: 24, color: "#FDA4AF" }}>
        {error}
      </p>
    );

  return car ? (
    <Showroom car={car} />
  ) : (
    <p style={{ margin: "auto", color: "#94A3B8" }}>Loading the car…</p>
  );
}

// Three cars, each an empty root with the parts attached; only the body takes the colour.
function Showroom({ car }: { car: Car }) {
  const world = useWorld(32, (w) => {
    w.spawn({ mesh: "plane", scale: [20, 1, 20], color: "#1E293B" });
    ["#818CF8", "#2DD4BF", "#E2E8F0"].forEach((color, i) => {
      const root = w.spawn({ mesh: "none", position: [(i - 1) * 4.6, 0, 0], spin: [0, 0.4, 0] }); // they turn together, so 4.6 apart clears each car's 4.4 length
      w.spawn({ mesh: car.body, parent: root, color });
      w.spawn({ mesh: car.glass, parent: root });
      w.spawn({ mesh: car.trim, parent: root });
    });
  });
  return (
    world && (
      <GameView
        source={world}
        camera={{ eye: [0, 4.5, 13], target: [0, 0.7, 0], fov: 0.9 }}
        background="#0F172A"
        style={{ flex: 1 }}
      />
    )
  );
}
`,
  },
  {
    id: "animated-character",
    title: "Character animation",
    category: "Assets",
    description: "Load a rigged model and crossfade between animation clips.",
    instruction: "Choose an animation using the buttons.",
    code: `// Load a rigged model and crossfade between animation clips.
// Choose an animation using the buttons.

import { useEffect, useRef, useState } from "react";
import {
  GameView,
  loadModel,
  loadTexture,
  useWorld,
  type Entity,
  type LoadedModel,
  type Texture,
} from "@nayan-ui/engine";

const CLIPS = ["idle", "walk", "run", "celebrate"];
type Hero = { model: LoadedModel; atlas: Texture };

// A rigged glTF character with its skeletal clips. Pick a clip to crossfade to it.
export default function AnimatedCharacter() {
  const [error, setError] = useState<string | null>(null);
  const [hero, setHero] = useState<Hero | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadModel("/playground/models/explorer.glb", { center: false, fit: 2, shine: 0.05 }),
      loadTexture("/playground/textures/explorer-atlas.png"),
    ])
      .then(([model, atlas]) => {
        if (active) setHero({ model, atlas });
      })
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : String(failure));
      });
    return () => {
      active = false;
    };
  }, []);

  if (error)
    return (
      <p role="alert" style={{ margin: "auto", padding: 24, color: "#FDA4AF" }}>
        {error}
      </p>
    );

  return hero ? (
    <Stage hero={hero} />
  ) : (
    <p style={{ margin: "auto", color: "#94A3B8" }}>Loading the character…</p>
  );
}

function Stage({ hero }: { hero: Hero }) {
  const body = useRef<Entity | null>(null);
  const world = useWorld(16, (w) => {
    w.spawn({ mesh: "plane", scale: [12, 1, 12], color: "#1E293B" });
    body.current = w.spawn({ mesh: hero.model, texture: hero.atlas });
    w.playClip(body.current, "idle");
  });

  if (!world) return null;
  return (
    <div style={{ flex: 1, display: "flex", position: "relative" }}>
      <GameView
        source={world}
        camera={{ eye: [0, 1.6, 4.2], target: [0, 1, 0], fov: 0.9 }}
        background="#0F172A"
        style={{ flex: 1 }}
      />
      <div style={{ position: "absolute", left: 12, top: 12, display: "flex", gap: 8 }}>
        {CLIPS.map((clip) => (
          <button
            type="button"
            key={clip}
            onClick={() =>
              body.current !== null && world.playClip(body.current, clip, { fade: 0.25 })
            }
            style={BUTTON}
          >
            {clip}
          </button>
        ))}
      </div>
    </div>
  );
}

const BUTTON = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid #475569",
  background: "#1E293B",
  color: "#F8FAFC",
  font: "inherit",
  cursor: "pointer",
};
`,
  },
  {
    id: "textures",
    title: "Image textures",
    category: "Assets",
    description: "Apply image textures to primitive meshes.",
    instruction: "Change the shapes or the images in FILES.",
    code: `// Apply image textures to primitive meshes.
// Change the shapes or the images in FILES.

import { useEffect, useState } from "react";
import { GameView, loadTexture, useWorld, type Texture } from "@nayan-ui/engine";

const FILES = ["asphalt.png", "grass.png", "bark.jpg"];

// Images drawn on meshes. A textured entity usually keeps color "white" so the image shows as it is.
export default function Textures() {
  const [error, setError] = useState<string | null>(null);
  const [textures, setTextures] = useState<Texture[] | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all(FILES.map((file) => loadTexture(\`/playground/textures/\${file}\`)))
      .then((loaded) => active && setTextures(loaded))
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : String(failure));
      });
    return () => {
      active = false;
    };
  }, []);

  if (error)
    return (
      <p role="alert" style={{ margin: "auto", padding: 24, color: "#FDA4AF" }}>
        {error}
      </p>
    );

  return textures ? (
    <Scene textures={textures} />
  ) : (
    <p style={{ margin: "auto", color: "#94A3B8" }}>Loading the textures…</p>
  );
}

function Scene({ textures }: { textures: Texture[] }) {
  const world = useWorld(16, (w) => {
    w.spawn({ mesh: "plane", scale: [14, 1, 14], texture: textures[1], color: "white" });
    textures.forEach((texture, i) => {
      w.spawn({
        mesh: i === 1 ? "sphere" : "cube",
        texture,
        color: "white",
        position: [(i - 1) * 2.4, 1.2, 0],
        scale: 1.4,
        spin: [0.3, 0.6, 0],
      });
    });
  });
  return (
    world && (
      <GameView
        source={world}
        camera={{ eye: [0, 3, 7], target: [0, 1, 0], fov: 1 }}
        background="#0F172A"
        style={{ flex: 1 }}
      />
    )
  );
}
`,
  },
  {
    id: "sound-and-music",
    title: "Sound and music",
    category: "Assets",
    description: "Play a sound effect and control a looping audio track.",
    instruction: "Tap the ball for a sound, or use the audio buttons.",
    code: `// Play a sound effect and control a looping audio track.
// Tap the ball for a sound, or use the audio buttons.

import { useEffect, useMemo, useRef, useState } from "react";
import { audio, GameView, useWorld, type Entity, type Voice } from "@nayan-ui/engine";

// Tap the ball to bounce it with a sound; the button plays looping music.
export default function SoundAndMusic() {
  // One bank of named sounds, decoded by the engine's mixer. Plays are ignored until it's ready.
  const sounds = useMemo(
    () =>
      audio.load({
        coin: "/playground/sounds/coin.wav",
        jump: "/playground/sounds/jump.wav",
        music: "/playground/sounds/music.wav",
      }),
    [],
  );
  const music = useRef<Voice | null>(null);
  const [playing, setPlaying] = useState(false);
  const ball = useRef<Entity | null>(null);

  // Stop the music when the example closes.
  useEffect(() => () => audio.stop(music.current), []);

  const world = useWorld(32, (w) => {
    w.spawn({ mesh: "plane", scale: [20, 1, 20], color: "#1E293B", physics: "fixed" });
    ball.current = w.spawn({
      mesh: "sphere",
      position: [0, 3, 0],
      color: "#818CF8",
      physics: { type: "dynamic", bounce: 0.5 },
    });
  });

  const toggleMusic = () => {
    if (playing) {
      audio.stop(music.current);
      music.current = null;
    } else {
      music.current = sounds.play("music", { volume: 0.4, loop: true });
    }
    setPlaying(music.current !== null);
  };

  if (!world) return null;
  return (
    <div style={{ flex: 1, display: "flex", position: "relative" }}>
      <GameView
        source={world}
        camera={{ eye: [0, 4, 8], target: [0, 0.5, 0], fov: 1 }}
        background="#0F172A"
        onTap={(x, y) => {
          if (ball.current === null || world.pick(x, y)?.entity !== ball.current) return;
          world.impulse(ball.current, [0, 5, 0]);
          sounds.play("jump", { volume: 0.8 });
        }}
        style={{ flex: 1 }}
      />
      <div style={{ position: "absolute", left: 12, top: 12, display: "flex", gap: 8 }}>
        <button type="button" onClick={() => sounds.play("coin")} style={BUTTON}>
          Coin
        </button>
        <button type="button" onClick={toggleMusic} style={BUTTON}>
          {playing ? "Stop music" : "Play music"}
        </button>
      </div>
    </div>
  );
}

const BUTTON = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid #475569",
  background: "#1E293B",
  color: "#F8FAFC",
  font: "inherit",
  cursor: "pointer",
};
`,
  },
  {
    id: "text-and-fonts",
    title: "3D typography",
    category: "Assets",
    description: "Load a font and update an entity’s text.",
    instruction: "Tap to increment the counter.",
    code: `// Load a font and update an entity’s text.
// Tap to increment the counter.

import { useEffect, useRef, useState } from "react";
import { GameView, loadFont, useWorld, type Entity, type Font } from "@nayan-ui/engine";

// A TrueType font turned into 3D letters, and a score that counts your taps.
export default function TextAndFonts() {
  const [error, setError] = useState<string | null>(null);
  const [font, setFont] = useState<Font | null>(null);

  useEffect(() => {
    let active = true;
    loadFont("/playground/fonts/Inter-SemiBold.ttf", { depth: 0.25 })
      .then((loaded) => active && setFont(loaded))
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : String(failure));
      });
    return () => {
      active = false;
    };
  }, []);

  if (error)
    return (
      <p role="alert" style={{ margin: "auto", padding: 24, color: "#FDA4AF" }}>
        {error}
      </p>
    );

  return font ? (
    <Title font={font} />
  ) : (
    <p style={{ margin: "auto", color: "#94A3B8" }}>Loading the font…</p>
  );
}

function Title({ font }: { font: Font }) {
  const score = useRef<{ label: Entity | null; value: number }>({ label: null, value: 0 });
  const world = useWorld(256, (w) => {
    w.spawn({
      text: "Nayan Game Engine",
      font,
      position: [0, 1, 0],
      scale: 0.9,
      color: "#818CF8",
      spin: [0, 0.4, 0],
    });
    // tabular: every digit is as wide as the widest, so the number doesn't jitter as it changes.
    score.current.label = w.spawn({
      text: "Taps: 0",
      font,
      tabular: true,
      position: [0, -0.8, 0],
      scale: 0.5,
      color: "white",
    });
  });

  return (
    world && (
      <GameView
        source={world}
        camera={{ eye: [0, 0, 7], target: [0, 0.2, 0], fov: 1 }}
        background="#0F172A"
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
    description: "Convert pointer movement into bounded world coordinates.",
    instruction: "Drag left or right to move between the road edges.",
    code: `// Convert pointer movement into bounded world coordinates.
// Drag left or right to move between the road edges.

import { useRef } from "react";
import { GameView, useWorld, type Entity } from "@nayan-ui/engine";

// Drag left or right to steer the box between the road's edges.
export default function DragToSteer() {
  const player = useRef<{ box: Entity | null; x: number; from: number }>({
    box: null,
    x: 0,
    from: 0,
  });
  const world = useWorld(16, (w) => {
    w.spawn({ mesh: "plane", scale: [8, 1, 40], color: "#1E293B" });
    for (const x of [-4, 4])
      w.spawn({ mesh: "cube", position: [x, 0.2, 0], scale: [0.2, 0.4, 40], color: "#94A3B8" });
    player.current.box = w.spawn({ mesh: "roundedBox", position: [0, 0.5, 2], color: "#818CF8" });
  });

  return (
    world && (
      <GameView
        source={world}
        camera={{ eye: [0, 5, 9], target: [0, 0, -2], fov: 1 }}
        background="#0F172A"
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
    description: "Stack dynamic bodies and let the engine resolve collisions.",
    instruction: "Tap to drop a ball onto the tower.",
    code: `// Stack dynamic bodies and let the engine resolve collisions.
// Tap to drop a ball onto the tower.

import { GameView, useWorld } from "@nayan-ui/engine";

// A tower of dynamic blocks. Tap to drop a heavy ball on it.
export default function PhysicsTower() {
  const world = useWorld(256, (w) => {
    w.spawn({ mesh: "plane", scale: [30, 1, 30], color: "#1E293B", physics: "fixed" });
    for (let level = 0; level < 8; level++)
      for (let i = 0; i < 3; i++)
        w.spawn({
          mesh: "cube",
          position: [(i - 1) * 1.05, 0.5 + level * 1.02, 0],
          color: level % 2 ? "#818CF8" : "#38BDF8",
          physics: { type: "dynamic", friction: 0.8 },
        });
  });

  return (
    world && (
      <GameView
        source={world}
        camera={{ eye: [0, 5, 14], target: [0, 3, 0], fov: 1 }}
        background="#0F172A"
        onTap={() =>
          world.spawn({
            mesh: "sphere",
            position: [(Math.random() - 0.5) * 2, 12, 0],
            scale: 1.2,
            color: "#FB7185",
            physics: { type: "dynamic", shape: "ball", density: 8 },
            lifetime: 10,
          })
        }
        style={{ flex: 1 }}
      />
    )
  );
}
`,
  },
];
