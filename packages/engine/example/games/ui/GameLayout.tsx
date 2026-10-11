import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Image,
  Pressable,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { Stack } from "expo-router";
import { HeaderButton, useHeaderHeight } from "expo-router/react-navigation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { audio, haptics } from "@nayan-ui/engine";
import { LIGHT, setDarkMode, useGameTheme, type Theme } from "./theme";

// One layout for every game, after Playtura's game screen: the navigator's header (title, subtitle,
// settings), a scoreboard whose columns each game chooses, and the game controls (leaderboard, the
// main START / STOP button, share), plus the game-over, leaderboard and settings cards.

const TROPHY_ICON = require("../../assets/icons/trophy.png");
const SHARE_ICON = require("../../assets/icons/share.png");

/**
 * How a host app configures a game, like Playtura's GameProps: the side buttons appear only when
 * given (Playtura shows its leaderboard and share buttons only for `onShowLeaderboard` / `onShare`).
 */
export type GameProps = {
  /** The leaderboard button: a function to handle it yourself, `true` for the built-in session leaderboard, omitted to hide it. */
  leaderboard?: boolean | (() => void);
  /** The share button: a function given the score, `true` for the system share sheet, omitted to hide it. */
  share?: boolean | ((score: number) => void);
  /** "light" or "dark", like Playtura's `settings.theme`. Default: the system theme (and the settings switch). */
  theme?: "light" | "dark";
};

export type GamePhase = "ready" | "playing" | "over";

export type GameResult = {
  title: string;
  message: string;
  score: number;
  best: number;
  /** Extra lines under the score card (a medal, a record). */
  extra?: ReactNode;
};

export type GameLayoutProps = GameProps & {
  title: string;
  /** Under the title (Playtura shows the level). */
  subtitle?: string;
  /** "ready" and "over" offer START, "playing" offers STOP. */
  phase: GamePhase;
  /** The scoreboard's columns: `ScoreColumn`s, `ScoreLives`, anything. Omit for no scoreboard. */
  scoreboard?: ReactNode;
  /** The main button's text while waiting. */
  startLabel?: string;
  startHint?: string;
  onStart: () => void;
  /** STOP GAME while playing (omit to hide the main button during play). */
  onStop?: () => void;
  /** The game-over card, once it should show. */
  result?: GameResult | null;
  onPlayAgain: () => void;
  /** This session's best runs, for the built-in leaderboard. */
  scores?: number[];
  /** The score the share button shares, and its message. */
  shareScore?: number;
  shareMessage?: (score: number) => string;
  /** The scene (a GameView) and the game's own overlays, under the header, scoreboard and controls. */
  children: ReactNode;
};

/** Where a game's overlays can go: below the header (and scoreboard), above the controls. */
export function useGameInsets() {
  const header = useHeaderHeight();
  return { header, top: header + SCOREBOARD_SPACE, bottom: CONTROLS_SPACE };
}
const SCOREBOARD_SPACE = 15 + 82;
const CONTROLS_SPACE = 112;

export function GameLayout(props: GameLayoutProps) {
  const {
    title,
    subtitle,
    phase,
    scoreboard,
    onStart,
    onStop,
    result,
    onPlayAgain,
    leaderboard,
    share,
    children,
  } = props;
  const theme = useGameTheme(props.theme);
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const header = useHeaderHeight();
  const { width } = useWindowDimensions();
  const gameWidth = Math.min(width - 30, 500); // Playtura's getGameDimensions(): the scoreboard and controls are this wide
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  // Playtura's START GAME button breathes while the game waits for you.
  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  useEffect(() => {
    if (phase === "playing") {
      cancelAnimation(pulse);
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
    );
    return () => cancelAnimation(pulse);
  }, [phase, pulse]);

  const onShare = () => {
    const score = props.shareScore ?? result?.score ?? 0;
    if (typeof share === "function") share(score);
    else
      Share.share({
        message:
          props.shareMessage?.(score) ??
          `I scored ${score} in ${title} on the Nayan engine! Can you beat it?`,
      });
  };

  const context = useMemo(() => ({ theme, styles }), [theme, styles]);
  return (
    <LayoutContext.Provider value={context}>
      <View style={styles.root}>
        {/* The navigator's header, see-through over the scene, themed like Playtura's. */}
        <Stack.Screen
          options={{
            // No swipe-back mid-game: steering swipes near the left edge would leave the screen.
            gestureEnabled: phase !== "playing",
            headerTransparent: true,
            headerShadowVisible: false,
            headerTintColor: theme.HEADER_TINT,
            headerTitleAlign: "center",
            headerBackground: () => <View style={styles.headerBackground} />,
            headerTitle: () => (
              <View style={styles.headerTitleBox}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={styles.headerSubtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            ),
            headerRight: () => (
              <HeaderButton
                onPress={() => setSettingsOpen(true)}
                accessibilityLabel="Game settings"
              >
                <Ionicons name="settings-outline" size={24} color={theme.HEADER_TINT} />
              </HeaderButton>
            ),
            statusBarStyle: theme.dark ? "light" : "dark",
          }}
        />

        {children}

        {/* Playtura's scoreboard; each game fills in its own columns. */}
        {scoreboard ? (
          <View style={[styles.boardWrap, { top: header + 15 }]} pointerEvents="none">
            <View style={[styles.board, { width: gameWidth }]}>{scoreboard}</View>
          </View>
        ) : null}

        {/* Playtura's game controls: leaderboard, the main button, share. */}
        <View style={styles.controls} pointerEvents="box-none">
          <View style={[styles.controlsRow, { width: gameWidth }]}>
            {leaderboard ? (
              <IconButton
                icon={TROPHY_ICON}
                label="Leaderboard"
                onPress={
                  typeof leaderboard === "function" ? leaderboard : () => setLeaderboardOpen(true)
                }
              />
            ) : null}

            {phase === "playing" ? (
              onStop ? (
                <View style={styles.mainWrap}>
                  <Pressable style={styles.mainButton} onPress={onStop}>
                    <Text style={styles.mainText}>STOP GAME</Text>
                    <Text style={styles.mainSubtext}>Stop current game</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.mainWrap} />
              )
            ) : (
              <Animated.View style={[styles.mainWrap, pulseStyle]}>
                <Pressable
                  style={styles.mainButton}
                  onPress={phase === "ready" ? onStart : onPlayAgain}
                >
                  <Text style={styles.mainText} numberOfLines={1}>
                    {props.startLabel ?? "START GAME"}
                  </Text>
                  {props.startHint ? (
                    <Text style={styles.mainSubtext} numberOfLines={1}>
                      {props.startHint}
                    </Text>
                  ) : null}
                </Pressable>
              </Animated.View>
            )}

            {share ? <IconButton icon={SHARE_ICON} label="Share" onPress={onShare} /> : null}
          </View>
        </View>

        {result ? (
          <ResultCard result={result} theme={theme} styles={styles} onPlayAgain={onPlayAgain} />
        ) : null}

        {/* Leaderboard: this session's best runs (the example has no backend). */}
        {leaderboardOpen && (
          <Pressable style={styles.overlay} onPress={() => setLeaderboardOpen(false)}>
            <Pressable style={styles.card} onPress={() => {}}>
              <Image
                source={TROPHY_ICON}
                style={[styles.cardIcon, { tintColor: theme.SCORE_HIGHLIGHT }]}
              />
              <Text style={styles.cardTitle}>Leaderboard</Text>
              {!props.scores?.length ? (
                <Text style={styles.cardMessage}>No runs yet: start a game!</Text>
              ) : (
                <View style={styles.ranks}>
                  {props.scores.map((value, i) => (
                    <View key={i} style={styles.rankRow}>
                      <Text style={styles.rankPlace}>#{i + 1}</Text>
                      <Text style={styles.rankScore}>{value}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Pressable style={styles.solidButton} onPress={() => setLeaderboardOpen(false)}>
                <Text style={styles.solidButtonText}>Close</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        )}

        {settingsOpen && (
          <SettingsCard theme={theme} styles={styles} onClose={() => setSettingsOpen(false)} />
        )}
      </View>
    </LayoutContext.Provider>
  );
}

function IconButton({
  icon,
  label,
  onPress,
}: {
  icon: ImageSourcePropType;
  label: string;
  onPress: () => void;
}) {
  const { theme, styles } = useContext(LayoutContext);
  return (
    <Pressable style={styles.iconButton} onPress={onPress} accessibilityLabel={label}>
      <Image source={icon} style={[styles.icon, { tintColor: theme.TEXT }]} />
    </Pressable>
  );
}

type Styles = ReturnType<typeof makeStyles>;

/** The layout's theme, for the scoreboard pieces and HUD pills inside it. */
const LayoutContext = createContext<{ theme: Theme; styles: Styles }>({
  theme: LIGHT,
  styles: makeStyles(LIGHT),
});

/** Playtura's game-over card, springing in. */
function ResultCard({
  result,
  theme,
  styles,
  onPlayAgain,
}: {
  result: GameResult;
  theme: Theme;
  styles: Styles;
  onPlayAgain: () => void;
}) {
  const card = useSharedValue(0);
  const cardStyle = useAnimatedStyle(() => ({
    opacity: card.value,
    transform: [{ scale: 0.85 + card.value * 0.15 }],
  }));
  useEffect(() => {
    card.value = withSpring(1, { damping: 12, stiffness: 180 });
  }, [card]);
  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Image
          source={TROPHY_ICON}
          style={[styles.cardIcon, { tintColor: theme.SCORE_HIGHLIGHT }]}
        />
        <Text style={styles.cardTitle}>{result.title}</Text>
        <Text style={styles.cardMessage}>{result.message}</Text>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Final Score</Text>
          <Text style={styles.scoreValue}>{result.score}</Text>
          <Text style={styles.scoreBest}>Best {result.best}</Text>
        </View>
        {result.extra}
        <Pressable
          style={styles.solidButton}
          onPress={() => {
            haptics.selection();
            onPlayAgain();
          }}
        >
          <Text style={styles.solidButtonText}>▶ Play Again!</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

/** Playtura's settings: sound, haptics and the theme, shared by every game. */
function SettingsCard({
  theme,
  styles,
  onClose,
}: {
  theme: Theme;
  styles: Styles;
  onClose: () => void;
}) {
  const [soundOn, setSoundOn] = useState(!audio.muted);
  const [hapticsOn, setHapticsOn] = useState(haptics.enabled);
  const rows = [
    ["Sounds", soundOn, (on: boolean) => ((audio.muted = !on), setSoundOn(on))],
    ["Haptics", hapticsOn, (on: boolean) => ((haptics.enabled = on), setHapticsOn(on))],
    ["Dark mode", theme.dark, (on: boolean) => setDarkMode(on)],
  ] as const;
  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.card} onPress={() => {}}>
        <Text style={styles.cardTitle}>Settings</Text>
        {rows.map(([label, on, set]) => (
          <View key={label} style={styles.settingRow}>
            <Text style={styles.settingLabel}>{label}</Text>
            <Switch
              value={on}
              onValueChange={set}
              trackColor={{ false: theme.SWITCH_TRACK_OFF, true: theme.SWITCH_TRACK_ON }}
              thumbColor={theme.SWITCH_THUMB}
            />
          </View>
        ))}
        <Pressable style={styles.solidButton} onPress={onClose}>
          <Text style={styles.solidButtonText}>Done</Text>
        </Pressable>
      </Pressable>
    </Pressable>
  );
}

// ── Scoreboard pieces ───────────────────────────────────────────────────

/** A scoreboard column: a label over a value. Pass `pop` (from `usePop`) to bounce the value. */
export function ScoreColumn({
  label,
  value,
  danger,
  pop,
}: {
  label: string;
  value: ReactNode;
  danger?: boolean;
  pop?: SharedValue<number>;
}) {
  const { theme, styles } = useContext(LayoutContext);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop?.value ?? 1 }] }));
  return (
    <View style={styles.column}>
      <Text style={styles.label}>{label}</Text>
      <Animated.Text style={[styles.value, danger && { color: theme.DANGER }, popStyle]}>
        {value}
      </Animated.Text>
    </View>
  );
}

/** A LIVES column: hearts, filled up to `lives`. */
export function ScoreLives({
  lives,
  max,
  label = "LIVES",
}: {
  lives: number;
  max: number;
  label?: string;
}) {
  const { styles } = useContext(LayoutContext);
  return (
    <View style={styles.column}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.hearts}>
        {Array.from({ length: max }, (_, i) => (
          <Text key={i} style={styles.heart}>
            {i < lives ? "❤️" : "🖤"}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** A TIMER column, mm:ss, red from `low` seconds. */
export function ScoreTimer({
  seconds,
  low = 10,
  label = "TIMER",
}: {
  seconds: number;
  low?: number;
  label?: string;
}) {
  return <ScoreColumn label={label} value={formatTime(seconds)} danger={seconds <= low} />;
}

export const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

/** A shared value and a trigger that bounces a `ScoreColumn` (on the UI thread). */
export function usePop() {
  const pop = useSharedValue(1);
  const bounce = useMemo(
    () => () => {
      pop.value = withSequence(
        withTiming(1.3, { duration: 0 }),
        withSpring(1, { damping: 8, stiffness: 320 }),
      );
    },
    [pop],
  );
  return [pop, bounce] as const;
}

/** A themed pill for a game's own HUD (hints, gauges). */
export function HudPill({
  children,
  highlight,
  small,
  fill,
}: {
  children: ReactNode;
  highlight?: boolean;
  small?: boolean;
  fill?: number;
}) {
  const { theme, styles } = useContext(LayoutContext);
  return (
    <View
      style={[
        styles.pill,
        small && styles.pillSmall,
        highlight && { borderColor: theme.SCORE_HIGHLIGHT },
      ]}
    >
      {fill !== undefined ? (
        <View style={[styles.pillFill, { width: `${Math.round(fill * 100)}%` }]} />
      ) : null}
      <Text style={[styles.pillText, small && styles.pillTextSmall]}>{children}</Text>
    </View>
  );
}

function makeStyles(t: Theme) {
  const shadow = {
    textShadowColor: t.TEXT_SHADOW,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  };
  const BAR_HEIGHT = 64; // the scoreboard and the main button, whichever text the button shows
  const panel = { backgroundColor: t.SURFACE, borderColor: t.BORDER, borderWidth: t.BORDER_WIDTH };
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.BACKGROUND },

    headerBackground: {
      flex: 1,
      backgroundColor: t.HEADER_BACKGROUND,
      borderBottomWidth: 1,
      borderBottomColor: t.HEADER_BORDER,
    },
    headerTitleBox: { alignItems: "center" },
    headerTitle: { color: t.HEADER_TINT, fontSize: 18, fontWeight: "600" },
    headerSubtitle: { color: t.HEADER_TINT, fontSize: 14, fontWeight: "600", marginTop: -1 },

    boardWrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
    board: {
      ...panel,
      flexDirection: "row",
      alignItems: "center",
      height: BAR_HEIGHT,
      paddingHorizontal: 12,
      borderRadius: 18,
    },
    column: { flex: 1, alignItems: "center" },
    label: {
      color: t.TEXT,
      fontSize: 12,
      fontWeight: "500",
      letterSpacing: 1.2,
      marginBottom: 2,
      ...shadow,
    },
    value: {
      color: t.TEXT,
      fontSize: 22,
      lineHeight: 26,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
      ...shadow,
    },
    hearts: { flexDirection: "row" },
    heart: { fontSize: 20, lineHeight: 26, marginHorizontal: 3 },

    controls: { position: "absolute", bottom: 5, left: 0, right: 0, alignItems: "center" },
    controlsRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 20,
      paddingHorizontal: 16,
      gap: 20,
    },
    iconButton: {
      ...panel,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    icon: { width: 24, height: 24 },
    mainWrap: { flex: 1 },
    mainButton: {
      ...panel,
      height: BAR_HEIGHT,
      borderRadius: 30,
      paddingHorizontal: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    mainText: { color: t.TEXT, fontSize: 16, fontWeight: "800", letterSpacing: 1, ...shadow },
    mainSubtext: {
      color: t.TEXT,
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 0.5,
      marginTop: 2,
    },

    pill: {
      ...panel,
      minWidth: 104,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 14,
      alignItems: "center",
      overflow: "hidden",
    },
    pillSmall: { minWidth: 0, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    pillFill: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: t.FILL },
    pillText: {
      color: t.TEXT,
      fontSize: 13,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
      letterSpacing: 0.5,
      ...shadow,
    },
    pillTextSmall: { fontSize: 10, fontWeight: "500", letterSpacing: 0 },

    overlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: t.OVERLAY,
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      width: "95%",
      maxWidth: 500,
      borderRadius: 16,
      backgroundColor: t.BACKGROUND,
      padding: 20,
      alignItems: "center",
    },
    cardIcon: { width: 48, height: 48 },
    cardTitle: {
      color: t.TEXT,
      fontSize: 28,
      fontWeight: "bold",
      letterSpacing: 1,
      marginTop: 8,
      marginBottom: 4,
    },
    cardMessage: { color: t.TEXT_SUBTLE, fontSize: 14, marginBottom: 16, textAlign: "center" },
    ranks: { width: "100%", marginBottom: 20 },
    rankRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: t.SURFACE,
      marginTop: 6,
    },
    rankPlace: { color: t.TEXT, fontSize: 16, fontWeight: "700" },
    rankScore: {
      color: t.SCORE_HIGHLIGHT,
      fontSize: 16,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
    },
    scoreCard: {
      backgroundColor: t.SURFACE,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 32,
      alignItems: "center",
      marginBottom: 24,
    },
    scoreLabel: {
      color: t.TEXT_SUBTLE,
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: 1,
      marginBottom: 4,
    },
    scoreValue: {
      color: t.SCORE_HIGHLIGHT,
      fontSize: 44,
      fontWeight: "bold",
      fontVariant: ["tabular-nums"],
    },
    scoreBest: { color: t.TEXT_SUBTLE, fontSize: 12, fontWeight: "600", marginTop: 2 },
    solidButton: {
      width: "100%",
      paddingVertical: 16,
      borderRadius: 28,
      backgroundColor: t.SOLID,
      alignItems: "center",
    },
    solidButtonText: { color: t.ON_SOLID, fontSize: 17, fontWeight: "bold", letterSpacing: 0.5 },
    settingRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
    },
    settingLabel: { color: t.TEXT, fontSize: 16, fontWeight: "600" },
  });
}
