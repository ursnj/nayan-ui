// Starter programs for the playground. Each one default-exports the component the preview renders.
export interface PlaygroundExample {
  id: string;
  title: string;
  /** The group it's listed under in the picker. */
  category: "Basics" | "Assets" | "Input" | "Effects and physics";
  code: string;
}

/** The picker's groups, in order. */
export const PLAYGROUND_CATEGORIES: PlaygroundExample["category"][] = ["Basics", "Assets", "Input", "Effects and physics"];

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

  // Rebuilt when the car arrives: three cars, each an empty root with the parts attached.
  const world = useWorld(
    32,
    (w) => {
      if (!car) return;
      w.spawn({ mesh: "plane", scale: [20, 1, 20], color: "#334155" });
      ["#E53935", "#1E88E5", "#FDD835"].forEach((color, i) => {
        const root = w.spawn({ mesh: "none", position: [(i - 1) * 3, 0, 0], spin: [0, 0.4, 0] });
        w.spawn({ mesh: car.body, parent: root, color });
        w.spawn({ mesh: car.glass, parent: root });
        w.spawn({ mesh: car.trim, parent: root });
      });
    },
    [car],
  );

  if (!car || !world) return <p style={{ margin: "auto", color: "#94A3B8" }}>Loading the car…</p>;
  return <GameView source={world} camera={{ eye: [0, 3.5, 9], target: [0, 0.6, 0], fov: 0.9 }} background="#0F172A" style={{ flex: 1 }} />;
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

// A rigged glTF character with its skeletal clips. Pick a clip to crossfade to it.
export default function AnimatedCharacter() {
  const [hero, setHero] = useState<{ model: LoadedModel; atlas: Texture } | null>(null);
  const body = useRef<Entity | null>(null);

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

  const world = useWorld(
    16,
    (w) => {
      if (!hero) return;
      w.spawn({ mesh: "plane", scale: [12, 1, 12], color: "#3F6B3F" });
      body.current = w.spawn({ mesh: hero.model, texture: hero.atlas });
      w.playClip(body.current, "idle");
    },
    [hero],
  );

  if (!hero || !world) return <p style={{ margin: "auto", color: "#94A3B8" }}>Loading the character…</p>;
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

const BUTTON = { padding: "6px 12px", borderRadius: 8, border: "none", background: "white", fontWeight: 600, cursor: "pointer" };
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

  const world = useWorld(
    16,
    (w) => {
      if (!textures) return;
      w.spawn({ mesh: "plane", scale: [14, 1, 14], texture: textures[1], color: "white" });
      textures.forEach((texture, i) => {
        w.spawn({ mesh: i === 1 ? "sphere" : "cube", texture, color: "white", position: [(i - 1) * 2.4, 1.2, 0], scale: 1.4, spin: [0.3, 0.6, 0] });
      });
    },
    [textures],
  );

  if (!textures || !world) return <p style={{ margin: "auto", color: "#94A3B8" }}>Loading the textures…</p>;
  return <GameView source={world} camera={{ eye: [0, 3, 7], target: [0, 1, 0], fov: 1 }} background="#BFE3FF" style={{ flex: 1 }} />;
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

const BUTTON = { padding: "6px 12px", borderRadius: 8, border: "none", background: "white", fontWeight: 600, cursor: "pointer" };
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
  const score = useRef<{ label: Entity | null; value: number }>({ label: null, value: 0 });

  useEffect(() => {
    let active = true;
    loadFont("/playground/fonts/Inter-SemiBold.ttf", { depth: 0.25 }).then((loaded) => active && setFont(loaded));
    return () => {
      active = false;
    };
  }, []);

  const world = useWorld(
    256,
    (w) => {
      if (!font) return;
      w.spawn({ text: "Nayan Engine", font, position: [0, 1, 0], scale: 0.9, color: "#FFB400", spin: [0, 0.4, 0] });
      // tabular: every digit is as wide as the widest, so the number doesn't jitter as it changes.
      score.current.label = w.spawn({ text: "Taps: 0", font, tabular: true, position: [0, -0.8, 0], scale: 0.5, color: "white" });
    },
    [font],
  );

  if (!font || !world) return <p style={{ margin: "auto", color: "#94A3B8" }}>Loading the font…</p>;
  return (
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
          world.spawn({ mesh: "sphere", position: [(Math.random() - 0.5) * 2, 12, 0], scale: 1.2, color: "#E53935", physics: { type: "dynamic", mass: 8 }, lifetime: 10 })
        }
        style={{ flex: 1 }}
      />
    )
  );
}
`,
  },
];
