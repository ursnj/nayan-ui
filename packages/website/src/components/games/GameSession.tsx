"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { createKeyboardInput, type KeyboardInputMode } from "@nayan-ui/engine";
import {
  DEFAULT_GAME_SETTINGS,
  type GAME_IDS,
  type GameSettings,
  loadGameComponent,
} from "@nayan-ui/games/services";
import { THEMES } from "@nayan-ui/react";
import { ArrowLeft, BookOpen, Keyboard, Settings } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/components/helpers/ThemeProvider";
import { KBD } from "@/design/system";
import { shareGameScreenshot } from "@/lib/GameSharing";
import { resolveSiteGameTheme } from "@/lib/GameTheme";
import GamePopover from "./GamePopover";
import { GAME_TOOLBAR_BUTTON } from "./GameToolbar";

export interface GameSessionProps {
  gameId: GAME_IDS;
  title: string;
  panelOpen: boolean;
  onShowInfo: () => void;
}

/** Keyboard mapping per game, matching Playtura's web player. */
const DRAG_GAMES = new Set([
  "car-racing",
  "bike-racing",
  "penguin-run",
  "treasure-hunt",
  "boxing-arena",
  "tank-1990",
  "mob-control",
  "paper-io",
  "space-fighter",
]);
const SWIPE_GAMES = new Set(["game-2048", "snake-3d", "pac-man", "maze-runner", "crossy-road"]);

/** Below this width the toolbar sits above the scoreboard; above it, beside it. */
const WIDE_LAYOUT = 900;

const Key = ({ children }: { children: string }) => <kbd className={KBD}>{children}</kbd>;

const GameSession = memo(function GameSession({
  gameId,
  title,
  panelOpen,
  onShowInfo,
}: GameSessionProps) {
  const Game = useMemo(() => loadGameComponent(gameId), [gameId]);
  const { theme, setTheme } = useTheme();
  const siteTheme = theme === THEMES.DARK ? "dark" : "light";
  const [settings, setSettings] = useState<GameSettings>(() => ({
    ...DEFAULT_GAME_SETTINGS,
    theme: siteTheme,
  }));
  // Configures the games' light/dark palettes from the site tokens before the first game renders.
  resolveSiteGameTheme(settings.theme ?? siteTheme);

  // Site theme → game theme (e.g. the header's theme toggle).
  useEffect(() => {
    setSettings((current) =>
      current.theme === siteTheme ? current : { ...current, theme: siteTheme },
    );
  }, [siteTheme]);

  const surface = useRef<HTMLDivElement>(null);
  const [showKeys, setShowKeys] = useState(false);

  // Share a screenshot of the game, as Playtua's web player does: from the HUD's share button and the
  // game-over card. The game pauses once the frame is captured, until the share sheet closes.
  const sharing = useRef(false);
  const [sharePaused, setSharePaused] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const shareGame = useCallback(async () => {
    if (sharing.current || !surface.current) return;
    sharing.current = true;
    setShareStatus("Preparing screenshot…");
    try {
      setShareStatus(
        await shareGameScreenshot(surface.current, gameId, title, () => setSharePaused(true)),
      );
    } catch (error) {
      setShareStatus(error instanceof Error ? error.message : "Unable to share. Please try again.");
    } finally {
      sharing.current = false;
      setSharePaused(false);
    }
  }, [gameId, title]);
  useEffect(() => {
    if (!shareStatus || shareStatus === "Preparing screenshot…") return;
    const timer = window.setTimeout(() => setShareStatus(null), 5000);
    return () => window.clearTimeout(timer);
  }, [shareStatus]);

  const paused = panelOpen || showKeys || sharePaused;
  const settingsOpen = settings.isVisible;

  const focusSurface = useCallback(() => {
    requestAnimationFrame(() => surface.current?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    if (!paused && !settingsOpen) focusSurface();
  }, [paused, settingsOpen, focusSurface]);

  const keyboardMode: KeyboardInputMode = DRAG_GAMES.has(gameId)
    ? "drag"
    : SWIPE_GAMES.has(gameId)
      ? "swipe"
      : "pointer";

  useEffect(() => {
    const element = surface.current;
    if (!element || settingsOpen || paused) return;
    const keyboard = createKeyboardInput(element, {
      mode: keyboardMode,
      enabled: () => {
        const bounds = element.getBoundingClientRect();
        return bounds.bottom > 0 && bounds.top < window.innerHeight;
      },
      // The shared HUD's Start / Stop button, bottom-centre of the surface.
      primary: () => ({ x: element.clientWidth / 2, y: element.clientHeight - 47 }),
    });
    return () => keyboard.dispose();
  }, [keyboardMode, settingsOpen, paused]);

  const toolbar = useRef<HTMLDivElement>(null);
  const settingsTrigger = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState(64);

  useEffect(() => {
    const element = toolbar.current;
    const host = surface.current;
    if (!element || !host) return;
    const layout = () => {
      const bar = element.getBoundingClientRect();
      const origin = host.getBoundingClientRect().top;
      // Phones: the scoreboard sits under the toolbar. Wide screens: beside it, on the same row.
      setOffset(bar.width < WIDE_LAYOUT ? bar.bottom - origin : Math.max(0, bar.top - origin - 15));
      const trigger = settingsTrigger.current?.getBoundingClientRect();
      if (trigger)
        setSettings((current) => {
          const anchor = {
            top: trigger.bottom + 10,
            right: Math.max(12, window.innerWidth - trigger.right),
          };
          return current.anchor?.top === anchor.top && current.anchor.right === anchor.right
            ? current
            : { ...current, anchor };
        });
    };
    const observer = new ResizeObserver(layout);
    observer.observe(element);
    observer.observe(host);
    window.addEventListener("resize", layout);
    layout();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", layout);
    };
  }, []);

  // Game theme → site theme: the settings modal's theme switch restyles the whole site.
  const changeSettings = useCallback(
    (next: GameSettings) => {
      flushSync(() => {
        setSettings(next);
        if (next.theme) setTheme(next.theme === "dark" ? THEMES.DARK : THEMES.LIGHT);
      });
      if (!next.isVisible) focusSurface();
    },
    [setTheme, focusSurface],
  );

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <div
        ref={surface}
        tabIndex={0}
        className="nyn-game-surface relative flex h-full w-full overflow-hidden outline-none"
        aria-label={`${title} game`}
      >
        {Game ? (
          <Game
            settings={{
              ...settings,
              offset,
              paused,
              theme: settings.theme ?? siteTheme,
            }}
            onSettingsChange={changeSettings}
            onShare={shareGame}
            onShareScreenshot={shareGame}
          />
        ) : (
          <p role="alert" className="m-auto text-muted">
            This game is unavailable.
          </p>
        )}
      </div>

      <div
        ref={toolbar}
        className="pointer-events-none absolute inset-x-0 z-10 flex h-11 items-center justify-between min-[900px]:h-[68px]"
        style={{
          top: 15,
          paddingLeft: "max(16px, env(safe-area-inset-left))",
          paddingRight: "max(16px, env(safe-area-inset-right))",
        }}
      >
        <Link
          href="/games"
          aria-label="All games"
          title="All games"
          className={GAME_TOOLBAR_BUTTON}
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onShowInfo}
            aria-haspopup="dialog"
            aria-expanded={panelOpen}
            aria-label="Game rules and tips"
            title="Game rules and tips"
            className={GAME_TOOLBAR_BUTTON}
          >
            <BookOpen size={20} aria-hidden="true" />
          </button>
          <GamePopover
            title="Keyboard controls"
            icon={<Keyboard size={20} aria-hidden="true" />}
            onOpenChange={setShowKeys}
          >
            <ul className="space-y-2.5">
              <li>
                <Key>←</Key> <Key>↑</Key> <Key>→</Key> <Key>↓</Key> or <Key>W</Key> <Key>A</Key>{" "}
                <Key>S</Key> <Key>D</Key>
                <span className="mt-1 block">
                  {keyboardMode === "pointer"
                    ? "Move the cursor."
                    : keyboardMode === "swipe"
                      ? "Move."
                      : "Move or steer."}
                </span>
              </li>
              {keyboardMode !== "swipe" && (
                <li>
                  <Key>Space</Key>
                  <span className="mt-1 block">
                    {keyboardMode === "pointer"
                      ? "Select. Hold Space while moving to drag."
                      : "Tap."}
                  </span>
                </li>
              )}
              <li>
                <Key>Enter</Key>
                <span className="mt-1 block">Start, stop or play again.</span>
              </li>
            </ul>
            <p className="mt-4 border-t border-default pt-3 text-xs">Mouse and touch work too.</p>
          </GamePopover>
          <button
            ref={settingsTrigger}
            type="button"
            className={GAME_TOOLBAR_BUTTON}
            aria-label="Game settings"
            title="Game settings"
            aria-haspopup="dialog"
            aria-expanded={settings.isVisible}
            onClick={() => setSettings((current) => ({ ...current, isVisible: true }))}
          >
            <Settings size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      {shareStatus && (
        <p
          role="status"
          className="pointer-events-none absolute bottom-24 left-1/2 z-20 w-max max-w-[calc(100%-32px)] -translate-x-1/2 rounded-xl border border-default bg-surface px-4 py-3 text-center text-sm text-foreground shadow-lg"
        >
          {shareStatus}
        </p>
      )}
    </div>
  );
});

export default GameSession;
