import { useEffect, useRef, useState } from "react";
import { animations } from "@nayan-ui/engine/animations";
import { prepareCore } from "@nayan-ui/engine/core";
import { NView } from "@nayan-ui/engine/components";
import { DrawingCanvas, DrawingDocument } from "@nayan-ui/engine/drawing";
import {
  createShape,
  effects,
  FieldGraph,
  frontLight,
  GameView,
  generateWorldAsync,
  lathe,
  loadFont,
  loadModel,
  loadTexture,
  quat,
  toColor,
  useWorld,
  warmUpEngine,
  type Entity,
  type GameViewProps,
  type WorldSetup,
} from "@nayan-ui/engine/games";
import { ActionDemo, DemoButton, DemoControls, DemoPanel, DemoText } from "./Demo";

const blue = "#60a5fa";
const green = "#4ade80";
const pink = "#f472b6";
const camera: GameViewProps["camera"] = { eye: [5, 5, 8], target: [0, 1, 0], fov: 0.85 };
const viewport = { width: "100%", height: 340 } as const;

type SceneProps = Pick<
  GameViewProps,
  "onUpdate" | "onTap" | "onSwipe" | "onStats" | "quality" | "paused" | "light"
>;

function Scene({
  world,
  error,
  setError,
  flat,
  ...props
}: SceneProps & ReturnType<typeof useScene> & { flat?: boolean }) {
  if (error) return <DemoText>{error}</DemoText>;
  if (!world) return <DemoText>Preparing the game world…</DemoText>;
  return (
    <NView style={viewport}>
      <GameView
        {...props}
        source={world}
        camera={flat ? { eye: [0, 0, 12], target: [0, 0, 0], fov: 1, ortho: 7 } : camera}
        onError={(cause) => setError(cause.message)}
        background="#0f172a"
        style={{ flex: 1 }}
      />
    </NView>
  );
}

function useScene(setup: WorldSetup, capacity = 128) {
  const [error, setError] = useState<string>();
  const world = useWorld(capacity, setup, [], (cause) => setError(cause.message));
  return { world, error, setError };
}

export function WorldDemo() {
  const entity = useRef<Entity | null>(null);
  const [label, setLabel] = useState("The cube is in the world.");
  const scene = useScene((world) => {
    entity.current = world.spawn({ mesh: "cube", position: [0, 1, 0], color: blue });
  });
  const { world } = scene;
  return (
    <DemoPanel>
      <Scene {...scene} />
      <DemoControls>
        <DemoButton
          disabled={!world || entity.current !== null}
          onPress={() => {
            if (!world) return;
            entity.current = world.spawn({ mesh: "cube", position: [0, 1, 0], color: blue });
            setLabel("Spawned a cube.");
          }}
        >
          Spawn cube
        </DemoButton>
        <DemoButton
          disabled={!world || entity.current === null}
          onPress={() => {
            if (world && entity.current !== null)
              world.set(entity.current, { color: green, scale: 1.4 });
            setLabel("Updated color and scale.");
          }}
        >
          Update cube
        </DemoButton>
        <DemoButton
          disabled={!world || entity.current === null}
          onPress={() => {
            if (world && entity.current !== null) world.despawn(entity.current);
            entity.current = null;
            setLabel("Removed the cube.");
          }}
        >
          Despawn cube
        </DemoButton>
      </DemoControls>
      <DemoText>{label}</DemoText>
    </DemoPanel>
  );
}

export function LoopDemo() {
  const player = useRef<Entity | undefined>(undefined);
  const elapsed = useRef(0);
  const [paused, setPaused] = useState(false);
  const scene = useScene((world) => {
    player.current = world.spawn({ mesh: "cube", color: green });
    world.spawn({ mesh: "plane", position: [0, -0.2, 0], scale: [8, 1, 8], color: "#263750" });
  });
  return (
    <DemoPanel>
      <Scene
        {...scene}
        paused={paused}
        onUpdate={(dt) => {
          if (!scene.world || player.current === undefined) return;
          const time = (elapsed.current += dt);
          scene.world.transforms.set(player.current, {
            position: [Math.sin(time * 2) * 2, 1, Math.cos(time * 2) * 2],
            rotation: quat.y(time),
          });
        }}
      />
      <DemoButton onPress={() => setPaused(!paused)}>
        {paused ? "Resume loop" : "Pause loop"}
      </DemoButton>
    </DemoPanel>
  );
}

export function PhysicsDemo() {
  const ball = useRef<Entity | undefined>(undefined);
  const [contacts, setContacts] = useState(0);
  const collisionStep = useRef<(() => void) | undefined>(undefined);
  const scene = useScene((world) => {
    const floor = world.spawn({
      mesh: "plane",
      scale: [12, 1, 12],
      physics: "fixed",
      color: "#344e68",
    });
    ball.current = world.spawn({
      mesh: "sphere",
      position: [0, 4, 0],
      color: pink,
      physics: { type: "dynamic", bounce: 0.75 },
    });
    const update = () => {
      world.forEachCollision((a, b, { started }) => {
        if (started && (a === floor || b === floor)) setContacts((count) => count + 1);
      });
    };
    collisionStep.current = update;
  });
  return (
    <DemoPanel>
      <Scene {...scene} onUpdate={() => collisionStep.current?.()} />
      <DemoButton
        disabled={!scene.world}
        onPress={() => {
          if (ball.current !== undefined) scene.world?.impulse(ball.current, [0, 5, 0]);
        }}
      >
        Bounce ball
      </DemoButton>
      <DemoText>{`Floor contacts: ${contacts}`}</DemoText>
    </DemoPanel>
  );
}

const triangle = require("../assets/models/animated-triangle.glb");
let vase: ReturnType<typeof createShape> | undefined;

export function EntityAnimationDemo() {
  const box = useRef<Entity | undefined>(undefined);
  const model = useRef<{ entity: Entity; clip: string } | undefined>(undefined);
  const [note, setNote] = useState("Loading the bundled glTF clip…");
  const scene = useScene((world) => {
    box.current = world.spawn({ mesh: "cube", position: [-1.4, 1, 0], color: green });
    void loadModel(triangle, { fit: 2 }).then(
      (asset) => {
        if (world.isDisposed) return;
        const clip = asset.animations[0]?.name;
        if (!clip) {
          setNote("This model has no animation clips.");
          return;
        }
        model.current = { entity: world.spawn({ mesh: asset, position: [1.2, 0.8, 0] }), clip };
        setNote(`glTF clip: ${clip}`);
      },
      (error) => {
        if (!world.isDisposed) setNote(String(error));
      },
    );
  });
  return (
    <DemoPanel>
      <Scene {...scene} />
      <DemoControls>
        <DemoButton
          disabled={!scene.world}
          onPress={() => {
            if (scene.world && box.current !== undefined) {
              void animations.animate(
                scene.world,
                box.current,
                { scale: 1.8, position: [-1.4, 2.1, 0] },
                {
                  duration: 0.45,
                  easing: "back",
                  repeat: 1,
                  yoyo: true,
                },
              );
            }
          }}
        >
          Tween cube
        </DemoButton>
        <DemoButton
          disabled={!model.current}
          onPress={() => {
            if (scene.world && model.current)
              animations.playClip(scene.world, model.current.entity, model.current.clip, {
                loop: true,
              });
          }}
        >
          Play glTF clip
        </DemoButton>
        <DemoButton
          disabled={!model.current}
          onPress={() => {
            if (scene.world && model.current)
              animations.stopClip(scene.world, model.current.entity, true);
          }}
        >
          Stop glTF clip
        </DemoButton>
      </DemoControls>
      <DemoText>{note}</DemoText>
    </DemoPanel>
  );
}

export function EffectsDemo() {
  const scene = useScene((world) => {
    world.spawn({ mesh: "cylinder", scale: [1.6, 0.2, 1.6], color: "#334155" });
  }, 512);
  return (
    <DemoPanel>
      <Scene {...scene} />
      <DemoControls>
        <DemoButton
          disabled={!scene.world}
          onPress={() => {
            if (scene.world)
              effects.confetti(scene.world, {
                position: [0, 2, 0],
                colors: [blue, green, pink],
                count: 40,
                size: 0.12,
                speed: 4,
                lifetime: 1.4,
              });
          }}
        >
          Confetti
        </DemoButton>
        <DemoButton
          disabled={!scene.world}
          onPress={() => {
            if (scene.world)
              effects.sparkle(scene.world, {
                position: [0, 1, 0],
                colors: [blue, pink],
                count: 24,
                size: 0.1,
                speed: 3,
                lifetime: 1.2,
              });
          }}
        >
          Sparkles
        </DemoButton>
      </DemoControls>
    </DemoPanel>
  );
}

export function BoardDemo({ input = false }: { input?: boolean }) {
  const player = useRef<Entity | undefined>(undefined);
  const position = useRef({ x: 0, y: 0 });
  const [note, setNote] = useState(
    input ? "Tap a tile or swipe to move the center tile." : "Tap a tile to change its color.",
  );
  const scene = useScene((world) => {
    for (let x = -2; x <= 2; x++) {
      for (let y = -2; y <= 2; y++) {
        const entity = world.spawn({
          mesh: "cube",
          position: [x, y, 0],
          scale: [0.9, 0.9, 0.3],
          color: (x + y) % 2 === 0 ? "#355678" : "#28425c",
        });
        if (x === 0 && y === 0) player.current = entity;
      }
    }
    if (input && player.current !== undefined)
      world.set(player.current, { color: pink, position: [0, 0, 0.3] });
  });
  return (
    <DemoPanel>
      <Scene
        {...scene}
        flat
        light={frontLight([-0.4, 0.6, 1], 0.5)}
        onTap={(x, y) => {
          const hit = scene.world?.pick(x, y);
          if (!hit) return;
          scene.world?.set(hit.entity, { color: toColor(green) });
          setNote("Picked one tile and changed its color.");
        }}
        onSwipe={
          input
            ? (direction) => {
                if (!scene.world || player.current === undefined) return;
                const { x, y } = position.current;
                const clamp = (point: number) => Math.max(-2, Math.min(2, point));
                position.current = {
                  x: clamp(x + (direction === "right" ? 1 : direction === "left" ? -1 : 0)),
                  y: clamp(y + (direction === "up" ? 1 : direction === "down" ? -1 : 0)),
                };
                scene.world.set(player.current, {
                  position: [position.current.x, position.current.y, 0.3],
                });
                setNote(`Swiped ${direction}.`);
              }
            : undefined
        }
      />
      <DemoText>{note}</DemoText>
    </DemoPanel>
  );
}

export function GameAssetsDemo() {
  const [status, setStatus] = useState("Loading assets…");
  const scene = useScene((world) => {
    void Promise.all([
      loadModel(require("../assets/models/car/car_body.glb"), { fit: 3 }),
      loadTexture(require("../assets/textures/asphalt.png")),
      loadFont(require("../assets/fonts/Inter-SemiBold.ttf")),
    ])
      .then(([model, texture, font]) => {
        if (world.isDisposed) return;
        world.spawn({ mesh: model, position: [0, 0.3, 0] });
        world.spawn({ mesh: "plane", scale: [8, 1, 8], texture });
        world.spawn({ text: "NAYAN", font, position: [0, 2.5, 0], scale: 0.7, color: blue });
        setStatus("Loaded glTF, PNG, and TrueType font.");
      })
      .catch((error) => {
        if (!world.isDisposed) setStatus(String(error));
      });
  });
  return (
    <DemoPanel>
      <Scene {...scene} />
      <DemoText>{status}</DemoText>
    </DemoPanel>
  );
}

export function ScoreDemo() {
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(true);
  const [note, setNote] = useState("Start the clock to play.");
  const pendingPoint = useRef<number | undefined>(undefined);
  const scene = useScene((world) => {
    world.spawn({ mesh: "cylinder", color: green, position: [0, 1, 0] });
    return world.scoreboard.listen({
      onScore: setScore,
      onSecond: setSeconds,
      onTimeUp: () => {
        setPaused(true);
        setNote("Time is up. Start a new round.");
      },
    });
  });
  const { world } = scene;
  return (
    <DemoPanel>
      <Scene {...scene} paused={paused} />
      <DemoControls>
        <DemoButton
          disabled={!world}
          onPress={() => {
            if (!world) return;
            if (pendingPoint.current !== undefined) world.cancelTimer(pendingPoint.current);
            pendingPoint.current = undefined;
            world.scoreboard.reset(1, 15);
            world.scoreboard.resume();
            setScore(0);
            setSeconds(15);
            setPaused(false);
            setNote("Each point uses a world timer.");
          }}
        >
          Start round
        </DemoButton>
        <DemoButton
          disabled={!world || paused}
          onPress={() => {
            if (!world || pendingPoint.current !== undefined) return;
            pendingPoint.current = world.after(0.2, () => {
              pendingPoint.current = undefined;
              if (world.scoreboard.running) world.scoreboard.add(1);
            });
          }}
        >
          Add point
        </DemoButton>
        <DemoButton
          disabled={!world || seconds === 0}
          onPress={() => {
            if (paused) world?.scoreboard.resume();
            else world?.scoreboard.stop();
            setPaused(!paused);
          }}
        >
          {paused ? "Resume" : "Pause"}
        </DemoButton>
      </DemoControls>
      <DemoText>{`Score: ${score} · ${seconds} seconds\n${note}`}</DemoText>
    </DemoPanel>
  );
}

export function ShapesDemo() {
  const scene = useScene((world) => {
    vase ??= createShape(
      lathe(
        [
          [0, 0],
          [0.4, 0.1],
          [0.6, 0.4],
          [0.28, 0.85],
          [0.4, 1.2],
        ],
        { segments: 32 },
      ),
    );
    world.spawn({ mesh: vase, position: [-1, 1, 0], scale: 1.8, color: pink });
    world.spawn({ mesh: vase, position: [1, 0.65, 0], scale: 1.2, color: blue });
  });
  return (
    <DemoPanel>
      <Scene {...scene} />
      <DemoText>Two entities reuse the same mesh, generated from five radii and heights.</DemoText>
    </DemoPanel>
  );
}

let terrainMesh: Promise<ReturnType<typeof createShape>> | undefined;

export function TerrainDemo() {
  const [note, setNote] = useState("Generating terrain…");
  const scene = useScene((world) => {
    const fields = new FieldGraph();
    fields.output("clear", fields.constant(1));
    fields.output(
      "height",
      fields.bumps(fields.x, fields.z, [
        [-2, 1, 1.5, 3, 3, 0],
        [2, -1, 2, 3, 3, 0],
      ]),
    );
    terrainMesh ??= generateWorldAsync({
      seed: 7,
      fields,
      terrain: {
        axis: Array.from({ length: 33 }, (_, index) => index / 4 - 4),
        height: "height",
        regions: [],
        fallback: { surface: 1, material: 0 },
        materials: 1,
      },
      walk: { boundary: 3.5, clearance: "clear", height: 1.5 },
      steps: [],
    })
      .then((terrain) => createShape(terrain.terrain(0), { center: false }))
      .catch((error) => {
        terrainMesh = undefined;
        throw error;
      });
    void terrainMesh.then(
      (mesh) => {
        if (world.isDisposed) return;
        world.spawn({ mesh, color: green });
        setNote("Rust generated the mesh from a seeded field graph with two hills.");
      },
      (error) => {
        if (!world.isDisposed) setNote(String(error));
      },
    );
  });
  return (
    <DemoPanel>
      <Scene {...scene} />
      <DemoText>{note}</DemoText>
    </DemoPanel>
  );
}

export function PerformanceDemo() {
  const [quality, setQuality] = useState<"low" | "high" | "auto">("auto");
  const [stats, setStats] = useState("Waiting for frame statistics…");
  const scene = useScene((world) => {
    for (let x = -4; x <= 4; x++) {
      for (let z = -4; z <= 4; z++) {
        world.spawn({
          mesh: "sphere",
          position: [x * 0.65, 0, z * 0.65],
          scale: 0.5,
          color: (x + z) % 2 === 0 ? blue : pink,
        });
      }
    }
  });
  return (
    <DemoPanel>
      <Scene
        {...scene}
        quality={quality}
        onStats={({ fps, renderMs, backend, quality: active }) => {
          setStats(
            `${Math.round(fps)} fps · ${renderMs.toFixed(2)} ms render · ${backend} · ${active}`,
          );
        }}
      />
      <DemoControls>
        {(["low", "high", "auto"] as const).map((setting) => (
          <DemoButton
            key={setting}
            disabled={quality === setting}
            onPress={() => setQuality(setting)}
          >
            {setting}
          </DemoButton>
        ))}
      </DemoControls>
      <DemoText>{stats}</DemoText>
    </DemoPanel>
  );
}

export function CoreDemo() {
  return (
    <ActionDemo
      actions={[
        {
          label: "Prepare core",
          async run() {
            await prepareCore();
            return "Rust core is ready.";
          },
        },
      ]}
    />
  );
}

export function DrawingDemo() {
  const [paper, setPaper] = useState<DrawingDocument>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let active = true;
    let document: DrawingDocument | undefined;
    void warmUpEngine()
      .then(() => {
        if (!active) return;
        document = new DrawingDocument(512, 512);
        document.setBrush({ brushType: "MARKER", color: "#2563eb", width: 12, opacity: 1 });
        setPaper(document);
      })
      .catch((cause) => {
        if (active) setError(String(cause));
      });
    return () => {
      active = false;
      document?.dispose();
    };
  }, []);
  if (error) return <DemoText>{error}</DemoText>;
  if (!paper) return <DemoText>Preparing the canvas…</DemoText>;
  return (
    <DemoPanel>
      <NView style={viewport}>
        <DrawingCanvas document={paper} mode="draw" style={{ flex: 1 }} />
      </NView>
      <ActionDemo
        actions={[
          {
            label: "Undo",
            run: () => (paper.undo() ? "Undid the last edit." : "Nothing to undo."),
          },
          {
            label: "Redo",
            run: () => (paper.redo() ? "Restored the last edit." : "Nothing to redo."),
          },
          {
            label: "Clear",
            run: () => {
              paper.clear();
              return "Canvas cleared.";
            },
          },
          {
            label: "Export SVG",
            run: () => `SVG contains ${paper.exportSVG().length} characters.`,
          },
        ]}
      />
    </DemoPanel>
  );
}
