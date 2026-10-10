import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { GameView, loadModel, Mesh, World, type Camera, type GameStats, type Model } from "@nayan-ui/engine";

const TREES = 120;
const ROCKETS = 150;

type Scene = { world: World; update: (dt: number) => void };

/** A forest of instanced trees (fixed colliders sized from the model) with rockets raining onto it. */
function createScene(tree: Model, rocket: Model): Scene {
  const world = new World(TREES + ROCKETS + 4);
  world.spawn({ mesh: Mesh.Plane, scale: [60, 1, 60], color: [0.35, 0.55, 0.3], physics: "fixed" });

  for (let i = 0; i < TREES; i++) {
    const angle = i * 2.39996; // golden angle: an even, natural-looking scatter
    const r = 4 + Math.sqrt(i) * 2.2;
    const scale = 1.4 + ((i * 37) % 10) / 10;
    world.spawn({
      mesh: tree.mesh,
      position: [Math.cos(angle) * r, (tree.size[1] * scale) / 2, Math.sin(angle) * r],
      rotation: [0, Math.sin(angle), 0, Math.cos(angle)],
      scale,
      physics: "fixed", // box collider = the model's bounding box * scale
    });
  }

  let timer = 0;
  let launched = 0;
  return {
    world,
    update(dt) {
      timer += dt;
      if (timer > 0.12 && world.count < TREES + ROCKETS + 1) {
        timer = 0;
        launched++;
        const a = launched * 1.7;
        world.spawn({
          mesh: rocket.mesh,
          position: [Math.cos(a) * 6, 18, Math.sin(a) * 6],
          rotation: [Math.sin(a), 0, 0, Math.cos(a)],
          scale: 1.2,
          spin: [0, 3, 0],
          lifetime: 12,
          physics: { type: "dynamic", bounce: 0.3 },
        });
      }
      world.update(dt);
    },
  };
}

export function Models() {
  const [models, setModels] = useState<[Model, Model] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<GameStats>({ fps: 0, updateMs: 0 });

  useEffect(() => {
    Promise.all([
      loadModel(require("../../assets/models/tree.glb"), { fit: 2 }),
      loadModel(require("../../assets/models/rocket.glb"), { fit: 1.5 }),
    ]).then(setModels, (e: Error) => setError(e.message));
  }, []);

  const scene = useMemo(() => (models ? createScene(...models) : null), [models]);
  useEffect(() => () => scene?.world.dispose(), [scene]);

  const camera = useMemo<Camera>(() => ({ eye: [0, 18, 34], target: [0, 2, 0], fov: Math.PI / 3 }), []);
  const onUpdate = useMemo(() => {
    let t = 0;
    return (dt: number) => {
      t += dt;
      scene?.update(dt);
      camera.eye[0] = Math.sin(t * 0.15) * 34;
      camera.eye[2] = Math.cos(t * 0.15) * 34;
    };
  }, [scene, camera]);

  return (
    <View style={styles.root}>
      {scene && (
        <GameView
          source={scene.world}
          camera={camera}
          background={[0.55, 0.75, 0.95]}
          fog={0.012}
          onUpdate={onUpdate}
          onStats={setStats}
        />
      )}
      <View style={styles.hud} pointerEvents="none">
        <Text style={styles.text}>{error ?? (scene ? `glTF models · ${stats.fps.toFixed(0)} fps` : "Loading models…")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#8cbff2" },
  hud: { position: "absolute", top: 64, left: 16 },
  text: { color: "#fff", fontSize: 13, fontWeight: "600", textShadowColor: "#0008", textShadowRadius: 3 },
});
