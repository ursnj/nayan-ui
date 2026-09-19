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
import { usePathname } from "next/navigation";
import { CheckList, DocsIntro } from "@/design/Primitives";
import {
  ACCENT_SOFT,
  BUTTON_SMALL,
  CARD,
  CARD_INTERACTIVE,
  GRID_GAP,
  H3,
  PILL,
} from "@/design/system";
import Sidebar from "@/helpers/Sidebar";
import SubHeader from "@/helpers/SubHeader";
import { GAME_CATEGORY_COUNT, GAME_COUNT } from "@/services/Counts";
import { GAMES_LIST } from "@/services/GamesData";
import { getMenuItem } from "@/services/Utils";

const categoryColors: Record<string, string> = {
  Puzzle: "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/25",
  Action: "bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/25",
  Arcade: "bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/25",
  Strategy: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/25",
};

const CAPABILITIES = [
  {
    icon: Zap,
    title: "High performance",
    items: [
      "60fps gameplay with React Native Skia",
      "Animations on Reanimated 3",
      "Delta-time physics loops",
      "Minimal re-renders via direct store subscriptions",
    ],
  },
  {
    icon: Smartphone,
    title: "Cross-platform",
    items: [
      "iOS, Android and Web",
      "Consistent performance across platforms",
      "Responsive to every screen size",
      "Notch-aware offset handling",
    ],
  },
  {
    icon: Volume2,
    title: "Audio and haptics",
    items: [
      "Sound effects and speech synthesis",
      "Haptic feedback",
      "Configurable audio settings",
      "Per-game sound customisation",
    ],
  },
  {
    icon: Settings2,
    title: "Customisable",
    items: [
      "Multiple difficulty levels",
      "Adjustable game parameters",
      "Persistent settings storage",
      "One settings interface for all of them",
    ],
  },
  {
    icon: Sparkles,
    title: "Game features",
    items: [
      "Physics simulation and collisions",
      "Particle systems and visual effects",
      "Procedural mazes and obstacles",
      "Scores and achievements",
    ],
  },
  {
    icon: Gamepad2,
    title: "Developer friendly",
    items: [
      "TypeScript throughout",
      "Shared GameControlButton and ScoreBoard",
      "One consistent API across every game",
      "Documented per game",
    ],
  },
];

const GamesMain = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  const categories = [...new Set(GAMES_LIST.map((game) => game.category))];

  return (
    <Sidebar title={component?.title || "Games"}>
      <DocsIntro
        lead={
          <>
            {GAME_COUNT} ready-made games for React Native projects, built on Skia, Reanimated,
            Gesture Handler and TypeScript for 60fps gameplay across iOS, Android and the web. Drop
            one into a screen, or read how it works and build your own.
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
              href="https://github.com/ursnj/nayan-ui"
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
          </>
        }
        facts={[
          { value: String(GAME_COUNT), label: "Games" },
          { value: String(GAME_CATEGORY_COUNT), label: "Categories" },
          { value: "60fps", label: "Target frame rate" },
          { value: "MIT", label: "Licence" },
        ]}
      />

      <SubHeader
        title="What you get"
        description="Every game in the package is built on the same foundations."
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
        description="Each one has its own page with how to play, tips and the props it takes."
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
                <img
                  src={`/games/${game.id}.png`}
                  alt={`${game.name} screenshot`}
                  className="aspect-square w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
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
    </Sidebar>
  );
};

export default GamesMain;
