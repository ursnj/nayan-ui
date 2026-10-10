import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  audio,
  GameView,
  haptics,
  loadFont,
  loadTexture,
  World,
  type Camera,
  type Color,
  type Entity,
  type Font,
  type Quat,
  type Texture,
} from "@nayan-ui/engine";

// Tic-tac-toe on a wooden board: tap a tile, pieces drop in, the winning line pulses.
// Shows: tap picking, animations (awaited), 3D text, textures, rounded boxes, tori, nested
// groups (an X is two bars under an invisible parent) and confetti bursts.

type Mark = "X" | "O";
type Cell = Mark | null;

const AUTOPLAY = process.env.EXPO_PUBLIC_AUTOPLAY === "1";
const SPACING = 2.2;
const RED: Color = [0.93, 0.3, 0.3];
const BLUE: Color = [0.25, 0.55, 1];
const TILE: Color = [0.98, 0.94, 0.86];
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6],
] as const;

const sfx = audio.load({
  place: require("../../assets/sfx/point.wav"),
  win: require("../../assets/sfx/pickup.wav"),
});

const yaw = (angle: number): Quat => [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)];
const pitch = (angle: number): Quat => [Math.sin(angle / 2), 0, 0, Math.cos(angle / 2)];
const cellPosition = (i: number): [number, number, number] => [((i % 3) - 1) * SPACING, 0, (Math.floor(i / 3) - 1) * SPACING];

function winnerOf(board: Cell[]) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { mark: board[a]!, line };
  }
  return null;
}

/** Perfect play (minimax), with an occasional random move so it can be beaten. */
function bestMove(board: Cell[], me: Mark): number {
  const free = board.flatMap((c, i) => (c ? [] : [i]));
  if (Math.random() < 0.25) return free[Math.floor(Math.random() * free.length)]!;
  const other: Mark = me === "X" ? "O" : "X";
  const score = (b: Cell[], turn: Mark, depth: number): number => {
    const win = winnerOf(b);
    if (win) return win.mark === me ? 10 - depth : depth - 10;
    if (b.every(Boolean)) return 0;
    const scores = b.flatMap((c, i) => {
      if (c) return [];
      b[i] = turn;
      const s = score(b, turn === "X" ? "O" : "X", depth + 1);
      b[i] = null;
      return [s];
    });
    return turn === me ? Math.max(...scores) : Math.min(...scores);
  };
  let best = free[0]!;
  let bestScore = -Infinity;
  for (const i of free) {
    board[i] = me;
    const s = score(board, other, 1);
    board[i] = null;
    if (s > bestScore) [best, bestScore] = [i, s];
  }
  return best;
}

function createGame(font: Font, wood: Texture, onScore: (x: number, o: number) => void) {
  const world = new World(300);
  world.spawn({ mesh: "plane", scale: 60, position: [0, -0.4, 0], color: [0.2, 0.32, 0.42] });
  world.spawn({ mesh: "roundedBox", texture: wood, scale: [7.4, 0.5, 7.4], position: [0, -0.25, 0] });
  const tiles = Array.from({ length: 9 }, (_, i) => {
    const [x, , z] = cellPosition(i);
    return world.spawn({ mesh: "roundedBox", position: [x, 0.1, z], scale: [2, 0.2, 2], color: TILE });
  });
  const status = world.spawn({ text: "", font, position: [0, 1.1, -4.6], rotation: pitch(-0.6), scale: 0.8, color: [1, 1, 1] });

  const g = {
    world,
    board: Array<Cell>(9).fill(null),
    pieces: Array<Entity | null>(9).fill(null),
    turn: "X" as Mark,
    busy: false,
    stopped: false,
    over: false,
    overAt: 0,
    elapsed: 0,
    aiAt: 0,
    wins: { X: 0, O: 0 },
  };

  const say = (text: string, color: Color) => world.set(status, { text, color });
  say(AUTOPLAY ? "WATCH" : "YOUR TURN", [1, 1, 1]);

  async function place(i: number) {
    if (g.board[i] || g.over || g.busy) return;
    g.busy = true;
    const mark = g.turn;
    g.board[i] = mark;
    const [x, , z] = cellPosition(i);
    // Each piece is a group (mesh "none") so it can drop and pulse as one; children move with it.
    const piece = world.spawn({ mesh: "none", position: [x, 4, z], scale: 0.3, pickable: false });
    if (mark === "X") {
      for (const angle of [Math.PI / 4, -Math.PI / 4]) {
        world.spawn({ mesh: "roundedBox", parent: piece, rotation: yaw(angle), scale: [1.7, 0.36, 0.38], color: RED, pickable: false });
      }
    } else {
      world.spawn({ mesh: "torus", parent: piece, scale: [1.5, 2.2, 1.5], color: BLUE, pickable: false });
    }
    g.pieces[i] = piece;
    world.animate(piece, { scale: 1 }, { duration: 0.35, easing: "back" });
    await world.animate(piece, { position: [x, 0.42, z] }, { duration: 0.5, easing: "bounce" });
    if (g.stopped) return; // the screen closed while the piece was dropping
    sfx.play("place", { volume: 0.6, pitch: mark === "X" ? 1 : 1.2 });
    haptics.impact(0.5, 0.6);

    const win = winnerOf(g.board);
    if (win) {
      g.over = true;
      g.overAt = g.elapsed;
      g.wins[win.mark]++;
      onScore(g.wins.X, g.wins.O);
      say(`${win.mark} WINS!`, win.mark === "X" ? RED : BLUE);
      sfx.play("win");
      haptics.notify("success");
      for (const c of win.line) {
        world.animate(g.pieces[c]!, { scale: 1.25 }, { duration: 0.35, repeat: "forever", yoyo: true, easing: "easeInOut" });
        world.burst({ position: [cellPosition(c)[0], 0.8, cellPosition(c)[2]], count: 24, speed: 6, size: 0.18, color: [RED, BLUE, [1, 0.85, 0.2], [1, 1, 1]] });
      }
      world.set(status, { scale: 0.3 });
      world.animate(status, { scale: 0.8 }, { duration: 0.6, easing: "elastic" });
    } else if (g.board.every(Boolean)) {
      g.over = true;
      g.overAt = g.elapsed;
      say("DRAW", [0.9, 0.9, 0.9]);
    } else {
      g.turn = mark === "X" ? "O" : "X";
      g.aiAt = g.elapsed + 0.35;
      say(g.turn === "X" && !AUTOPLAY ? "YOUR TURN" : `${g.turn} THINKS`, g.turn === "X" ? RED : BLUE);
    }
    g.busy = false;
  }

  function reset() {
    for (const p of g.pieces) if (p !== null) world.despawn(p);
    g.pieces.fill(null);
    g.board.fill(null);
    g.over = false;
    g.turn = "X";
    say(AUTOPLAY ? "WATCH" : "YOUR TURN", [1, 1, 1]);
  }

  return {
    world,
    dispose() {
      g.stopped = true;
      world.dispose();
    },
    tap(x: number, y: number) {
      if (g.over) return reset();
      if (g.turn !== "X" || AUTOPLAY) return;
      const hit = world.pick(x, y);
      const i = hit ? tiles.indexOf(hit.entity) : -1;
      if (i >= 0) void place(i);
    },
    update(dt: number) {
      g.elapsed += dt;
      world.update(dt);
      const aiTurn = g.turn === "O" || AUTOPLAY;
      if (!g.over && !g.busy && aiTurn && g.elapsed >= g.aiAt) void place(bestMove([...g.board], g.turn));
      if (g.over && AUTOPLAY && g.elapsed - g.overAt > 2.5) reset();
    },
  };
}

export function TicTacToe() {
  const [assets, setAssets] = useState<{ font: Font; wood: Texture } | null>(null);
  const [score, setScore] = useState({ x: 0, o: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      loadFont(require("../../assets/fonts/Inter-Bold.ttf"), { chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ!", depth: 0.25 }),
      loadTexture(require("../../assets/textures/wood.png")),
    ]).then(([font, wood]) => setAssets({ font, wood }), (e: Error) => setError(e.message));
  }, []);

  const game = useMemo(() => (assets ? createGame(assets.font, assets.wood, (x, o) => setScore({ x, o })) : null), [assets]);
  useEffect(() => () => game?.dispose(), [game]);
  const camera = useRef<Camera>({ eye: [0, 15, 11], target: [0, -0.6, 0.2], fov: Math.PI / 3.6 }).current;

  return (
    <View style={styles.root}>
      {game && (
        <GameView
          source={game.world}
          camera={camera}
          light={{ direction: [0.5, 1, 0.7], ambient: 0.45, shadowExtent: 8 }}
          background={[0.2, 0.32, 0.42]}
          onUpdate={game.update}
          onTap={game.tap}
        />
      )}
      <View style={styles.hud} pointerEvents="none">
        <Text style={styles.score}>
          <Text style={{ color: "#ee4d4d" }}>X {score.x}</Text>
          {"   :   "}
          <Text style={{ color: "#408cff" }}>{score.o} O</Text>
        </Text>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#33526b" },
  hud: { position: "absolute", top: 64, left: 0, right: 0, alignItems: "center" },
  score: { color: "#fff", fontSize: 22, fontWeight: "800" },
  error: { color: "#fff", marginTop: 8, paddingHorizontal: 24, textAlign: "center" },
});
