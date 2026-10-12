// Car Racing's screen: loads the assets, builds a run, and draws the HUD over the 3D view. The rules
// are in game.ts, what it draws in scene.ts, tuning and assets in config.ts.
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { GameView, type DragEvent } from "@nayan-ui/engine";
import { GameLayout, ScoreColumn, ScoreLives, ScoreTimer, useGameInsets, usePop, type GameProps } from "../ui/GameLayout";
import { useGameTheme, type Theme } from "../ui/theme";
import { AUTOPLAY, DAY_LIGHT, EDGE, GAME_DURATION, LIVES, LOW_TIME, NIGHT_LIGHT, NIGHT_SKY, SKY, STEER_WIDTH, loadAssets, type Assets } from "./config";
import { createGame, dispose, session, start, steer, tick, type Phase } from "./game";

export { preloadRacing } from "./config";

export type RacingProps = GameProps;

type RunProps = RacingProps & { assets: Assets; onRestart: () => void; dark: boolean };

/** One run, from the start screen to the results. Restarting mounts a new one. */
function Run({ assets: a, onRestart, dark, ...props }: RunProps) {
  const game = useMemo(() => createGame(a, dark), [a, dark]);
  const theme = useGameTheme(props.theme);
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useGameInsets();
  const { width } = useWindowDimensions();
  const [phase, setPhase] = useState<Phase>("ready");
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  // HUD animations run on the UI thread (Reanimated), so the game loop never stutters them.
  const [pop, bounce] = usePop();
  const flash = useSharedValue(0);
  const near = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const nearStyle = useAnimatedStyle(() => ({ opacity: near.value }));

  useEffect(() => {
    game.onPhase = setPhase;
    game.onLives = setLives;
    game.onTime = setTimeLeft;
    game.onScore = (s) => {
      setScore(s);
      bounce();
    };
    game.onFlash = () => {
      flash.value = withSequence(withTiming(0.6, { duration: 0 }), withTiming(0, { duration: 400 }));
    };
    game.onNearMiss = () => {
      near.value = withSequence(withTiming(1, { duration: 0 }), withTiming(0, { duration: 900 }));
    };
    return () => dispose(game);
  }, [game, flash, bounce, near]);

  // The results wait a moment, so the crash (or the finish) is seen before the panel covers it.
  useEffect(() => {
    if (phase !== "over") return;
    const t = setTimeout(() => setShowResults(true), 1200);
    return () => clearTimeout(t);
  }, [phase]);

  // Autoplay: start by itself and restart after a pause.
  useEffect(() => {
    if (!AUTOPLAY || phase === "playing") return;
    const t = setTimeout(phase === "ready" ? () => start(game) : onRestart, phase === "ready" ? 1500 : 3000);
    return () => clearTimeout(t);
  }, [phase, game, onRestart]);

  const onUpdate = useMemo(() => (dt: number) => tick(game, dt), [game]);

  // Relative steering: wherever the swipe starts, the car moves by how far the finger moves. Each move
  // adds its own distance, so pushing past the rail and swiping back responds at once.
  const onDrag = useMemo(() => ({ phase: touch, dx }: DragEvent) => steer(game, touch, dx, (2 * EDGE) / (STEER_WIDTH * width)), [game, width]);

  const won = lives > 0;
  const { best, top } = session;
  return (
    <GameLayout
      {...props}
      title="Car Racing"
      subtitle={best > 0 ? `Best ${best}` : "Level 1"}
      phase={phase}
      scoreboard={
        <>
          <ScoreColumn label="SCORE" value={score} pop={pop} />
          <ScoreLives lives={lives} max={LIVES} />
          <ScoreTimer seconds={timeLeft} low={LOW_TIME} />
        </>
      }
      startHint="Dodge traffic to score!"
      onStart={() => start(game)}
      onStop={onRestart}
      result={showResults ? { title: won ? "TIME UP!" : "CRASHED!", message: won ? "Great driving!" : "You ran out of lives!", score, best } : null}
      onPlayAgain={onRestart}
      scores={top}
      shareScore={Math.max(score, best)}
      shareMessage={(s) => `I scored ${s} in Car Racing on the Nayan engine! Can you beat it?`}
    >
      <GameView source={game.world} camera={game.camera} light={dark ? NIGHT_LIGHT : DAY_LIGHT} background={dark ? NIGHT_SKY : SKY} fog={0.0075} onUpdate={onUpdate} onDrag={onDrag} />

      <Animated.Text pointerEvents="none" style={[styles.nearMiss, { top: insets.top + 14 }, nearStyle]}>
        NEAR MISS!
      </Animated.Text>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, flashStyle]} />
    </GameLayout>
  );
}

export function Racing(props: RacingProps) {
  const [run, setRun] = useState(0);
  const [loaded, setLoaded] = useState<Assets | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    // Sounds don't hold up the scene: plays before they're decoded are skipped.
    loadAssets()
      .then((a) => alive && setLoaded(a))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);
  const restart = useMemo(() => () => setRun((r) => r + 1), []);
  // Dark mode drives at night: it follows the system like Playtura's games, or the settings switch.
  const theme = useGameTheme(props.theme);
  if (!loaded) {
    return (
      <View style={[baseStyles.loading, { backgroundColor: theme.BACKGROUND }]}>
        <Text style={[baseStyles.loadingText, { color: theme.TEXT }]}>{error ?? "Loading…"}</Text>
      </View>
    );
  }
  // A new theme rebuilds the scene (day or night), so it starts a fresh run.
  return <Run key={`${run}-${theme.dark}`} {...props} assets={loaded} onRestart={restart} dark={theme.dark} />;
}

const baseStyles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 18, fontWeight: "700" },
});

function makeStyles(t: Theme) {
  return StyleSheet.create({
    nearMiss: { position: "absolute", alignSelf: "center", color: t.SCORE_HIGHLIGHT, fontSize: 30, fontWeight: "900", fontStyle: "italic" },
    flash: { backgroundColor: "#ff3b3b" },
  });
}
