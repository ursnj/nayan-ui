"use client";

import {
  Gamepad2,
  Github,
  Package,
  Settings2,
  Smartphone,
  Sparkles,
  Volume2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { CheckList, DocsIntro } from "@/design/Primitives";
import {
  ACCENT_SOFT,
  BUTTON_SMALL,
  CARD,
  CARD_INTERACTIVE,
  CONTAINER,
  GRID_GAP,
  H1,
  H3,
  PILL,
} from "@/design/system";
import SubHeader from "@/components/helpers/SubHeader";
import { GAME_CATEGORY_COUNT, GAME_COUNT } from "@/services/Counts";
import { GAMES_LIST } from "@/services/GamesData";
import { REPO_URL } from "@/services/seo";

const categoryColors: Record<string, string> = {
  Puzzle: "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/25",
  Action: "bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/25",
  Arcade: "bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/25",
  Strategy: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/25",
};

/** Games without a screenshot in public/games yet; they show their emoji instead. */
const SCREENSHOTS_PENDING = new Set(["penguin-run", "play-with-tua", "treasure-hunt"]);

const CAPABILITIES = [
  {
    icon: Zap,
    title: "Nayan engine",
    items: [
      "Rust and wgpu rendering: Metal on iOS, Vulkan or GLES on Android",
      "WebAssembly with WebGPU or a WebGL2 fallback in browsers",
      "Physics, animation, particles and the scoreboard clock run in Rust",
      "Prepared assets saved on device and reused across runs",
    ],
  },
  {
    icon: Smartphone,
    title: "React Native and React",
    items: [
      "One package for Expo development builds and websites",
      "Browser build at lib/web for Next.js and Vite",
      "Keyboard play on the web through the engine's keyboard adapter",
      "Header offset and responsive layout from phones to tablets",
    ],
  },
  {
    icon: Volume2,
    title: "Audio and haptics",
    items: [
      "Sound effects mixed by the engine",
      "Native haptics, and vibration where browsers support it",
      "Sound and haptic switches in every game's settings",
      "Muted automatically while paused or in the background",
    ],
  },
  {
    icon: Settings2,
    title: "One settings model",
    items: [
      "The same GameSettings for every game",
      "Built-in settings modal with how-to-play instructions",
      "Light and dark themes, configurable with configureGameThemes",
      "paused for your own overlays",
    ],
  },
  {
    icon: Sparkles,
    title: "Complete game screens",
    items: [
      "Scoreboard, Start/Stop and results card drawn by the engine",
      "Loading screen while the engine and assets prepare",
      "Confetti, sparkles, shatters and other particle effects",
      "Optional share, leaderboard and banner-ad slots",
    ],
  },
  {
    icon: Gamepad2,
    title: "Developer friendly",
    items: [
      "TypeScript types for every prop and callback",
      "onEndGame reports win, lose or cancel once per run",
      "loadGameComponent loads only the game you open",
      "A documented file pattern for building new games",
    ],
  },
];

const GamesMain = () => {
  const categories = [...new Set(GAMES_LIST.map((game) => game.category))];

  return (
    // A full-width page with every game, like the video editor's page: no docs sidebar.
    <div className={`${CONTAINER} py-6 sm:py-8`}>
      <h1 className={`mb-4 ${H1}`}>Games</h1>
      <DocsIntro
        lead={
          <>
            {GAME_COUNT} ready-made games for React Native apps and React websites, rendered by the
            Nayan engine: Rust and wgpu on iOS and Android, WebAssembly with WebGPU or WebGL2 in
            browsers. Each one is a single component with the same props. These docs describe the
            engine-based release, version 1.20.0.
          </>
        }
        actions={
          <>
            <Link
              href="https://www.npmjs.com/package/@nayan-ui/games"
              target="_blank"
              rel="noopener noreferrer"
              className={BUTTON_SMALL}
            >
              <Package aria-hidden className="mr-2 h-4 w-4" />
              View on npm
            </Link>
            <Link
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={BUTTON_SMALL}
            >
              <Github aria-hidden className="mr-2 h-4 w-4" />
              View source
            </Link>
            <Link href="/games/installation" className={BUTTON_SMALL}>
              Installation
            </Link>
            <Link href="/games/build-a-game" className={BUTTON_SMALL}>
              Build a game
            </Link>
          </>
        }
        facts={[
          { value: String(GAME_COUNT), label: "Games" },
          { value: String(GAME_CATEGORY_COUNT), label: "Categories" },
          { value: "Web + Native", label: "Platforms" },
          { value: "Dual", label: "Licence" },
        ]}
      />

      <SubHeader
        title="What you get"
        description="Every game in the package is built on the same engine and screen."
      >
        <div className={`grid sm:grid-cols-2 lg:grid-cols-3 ${GRID_GAP}`}>
          {CAPABILITIES.map((capability) => {
            const Icon = capability.icon;
            return (
              <div key={capability.title} className={`${CARD} p-5`}>
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${ACCENT_SOFT}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className={H3}>{capability.title}</h3>
                </div>
                <CheckList items={capability.items} />
              </div>
            );
          })}
        </div>
      </SubHeader>

      <SubHeader
        title={`All ${GAME_COUNT} games`}
        description="Each one has its own page with its controls, rules and tips."
        action={
          <div className="hidden flex-wrap gap-1.5 sm:flex">
            {categories.map((category) => (
              <span
                key={category}
                className={`text-xs font-semibold ${PILL} ${categoryColors[category] ?? ""}`}
              >
                {category}
              </span>
            ))}
          </div>
        }
      >
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${GRID_GAP}`}>
          {GAMES_LIST.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className={`${CARD_INTERACTIVE} group overflow-hidden`}
            >
              <div className="relative overflow-hidden">
                {SCREENSHOTS_PENDING.has(game.id) ? (
                  <div
                    aria-hidden
                    className="flex aspect-square w-full items-center justify-center bg-default/40 text-7xl"
                  >
                    {game.emoji}
                  </div>
                ) : (
                  <img
                    src={`/games/${game.id}.png`}
                    alt={`${game.name} screenshot`}
                    className="aspect-square w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                )}
                <span
                  className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 text-xs font-semibold ${categoryColors[game.category]}`}
                >
                  {game.category}
                </span>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
                  <h3 className="flex items-center gap-2 text-base font-bold text-white">
                    <span aria-hidden className="text-lg">
                      {game.emoji}
                    </span>
                    {game.name}
                  </h3>
                </div>
              </div>
              <div className="p-4">
                <p className="mb-3 text-sm leading-relaxed text-muted">{game.description}</p>
                <ul className="flex flex-wrap gap-1.5">
                  {game.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-md bg-default/50 px-2 py-0.5 text-[11px] font-medium text-muted"
                    >
                      #{tag}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          ))}
        </div>
      </SubHeader>
    </div>
  );
};

export default GamesMain;
