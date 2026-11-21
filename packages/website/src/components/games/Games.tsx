"use client";

import { useEffect, useState } from "react";
import { NImage, NPress, NText } from "@nayan-ui/engine/components";
import { ArrowUpRight, Code2, Gamepad2, Github, Package } from "@/design/Icons";
import Link from "next/link";
import {
  CtaPanel,
  FaqList,
  FeatureCard,
  PageHero,
  Section,
  SectionHeader,
} from "@/design/Primitives";
import {
  ACCENT_SOFT,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CARD,
  CARD_INTERACTIVE,
  CARD_PAD,
  GRID_GAP,
  H4_CARD,
  PILL,
} from "@/design/system";
import { GAME_CATEGORY_COUNT } from "@/services/Counts";
import { GAMES_LIST } from "@/services/GamesData";
import { FAQS, FEATURES, STEPS } from "./content";
import { REPO_URL } from "@/services/seo";

const NPM_URL = "https://www.npmjs.com/package/@nayan-ui/games";

/**
 * Where the list was scrolled when a game was opened. A game screen locks page scrolling while it
 * plays, so the browser's own restoration can't be relied on when coming back.
 */
const SCROLL_KEY = "nyn-games-scroll";

const rememberScroll = () => {
  try {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
  } catch {}
};

const categoryColors: Record<string, string> = {
  Puzzle: "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/25",
  Action: "bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/25",
  Arcade: "bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/25",
  Strategy: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/25",
};

const FACTS = [
  "50+ games",
  `${GAME_CATEGORY_COUNT} categories`,
  "iOS, Android and web",
  "One props API",
];

/** A few screenshots as the hero image, in the slot the video editor uses for its screenshot. */
const HERO_GAMES = [
  "block-blast",
  "treasure-hunt",
  "candy-crush",
  "penguin-run",
  "bubble-shooter",
  "mob-control",
];

const GamesCollage = () => (
  <div
    className={`site-hero-media grid grid-cols-3 gap-1.5 overflow-hidden p-1.5 sm:gap-2 sm:p-2`}
  >
    {HERO_GAMES.map((id) => {
      const game = GAMES_LIST.find((item) => item.id === id);
      return (
        <Link key={id} href={`/games/${id}`} onClick={rememberScroll} aria-label={`Play ${game?.name ?? id}`} className="overflow-hidden rounded-lg">
          <NImage
            src={`/games/${id}.png`}
            alt=""
            width={400}
            height={400}
            className="block aspect-square w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </Link>
      );
    })}
  </div>
);

const GamesMain = () => {
  const categories = [...new Set(GAMES_LIST.map((game) => game.category))];
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(SCROLL_KEY);
      sessionStorage.removeItem(SCROLL_KEY);
    } catch {}
    const y = Number(saved);
    if (!saved || !Number.isFinite(y)) return;
    // After the game screen's scroll lock is gone and the list has laid out.
    const frame = requestAnimationFrame(() => window.scrollTo(0, y));
    return () => cancelAnimationFrame(frame);
  }, []);

  const shown = category ? GAMES_LIST.filter((game) => game.category === category) : GAMES_LIST;

  return (
    <>
      <PageHero
        media={<GamesCollage />}
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Games" }]}
        title="Play 50+ games"
        titleAccent="Built with Nayan Engine"
        lead="Play puzzle, arcade, action and strategy games in your browser. Add any game to a React or React Native app as a single component."
        actions={
          <>
            <a href="#all-games" className={BUTTON_PRIMARY}>
              <Gamepad2 aria-hidden className="mr-2 h-5 w-5" />
              Play a game
            </a>
            <Link href="/game-engine/installation" className={BUTTON_SECONDARY}>
              <Package aria-hidden className="mr-2 h-5 w-5" />
              Installation
            </Link>
          </>
        }
        pills={FACTS}
        note="Free for non-commercial use · TypeScript"
      />

      <Section id="all-games" labelledBy="all-games-heading">
        <SectionHeader id="all-games-heading" title="Game library" />
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {[null, ...categories].map((item) => (
              <NPress
                key={item ?? "all"}
                onPress={() => setCategory(item)}
                aria-pressed={category === item}
                className={`${PILL} min-h-8 px-3 transition-colors hover:border-accent/35 aria-pressed:border-accent/30 aria-pressed:bg-accent/10 aria-pressed:text-accent`}
              >
                {item ?? "All"}
              </NPress>
            ))}
          </div>
          <p aria-live="polite" className="font-mono text-xs text-muted">{shown.length} games</p>
        </div>
        <div className={`grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${GRID_GAP}`}>
          {shown.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              onClick={rememberScroll}
              className={`${CARD_INTERACTIVE} group min-w-0 overflow-hidden`}
            >
              <div className="overflow-hidden border-b border-border bg-surface-secondary/45">
                <NImage
                  src={`/games/${game.id}.png`}
                  alt=""
                  width={512}
                  height={512}
                  className="block aspect-[4/3] w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <p className={`mb-2 w-fit rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-medium ${categoryColors[game.category]}`}>
                  {game.category}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold tracking-tight">{game.name}</h3>
                  <ArrowUpRight aria-hidden size={17} className="shrink-0 text-muted group-hover:text-accent" />
                </div>
                <NText tag="p" className="mt-1.5 text-sm leading-relaxed text-muted">
                  {game.description}
                </NText>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section id="features" labelledBy="features-heading">
        <SectionHeader
          eyebrow="Features"
          id="features-heading"
          title="Everything a game screen needs"
          lead="Every game in the package is built on the same engine and screen."
        />
        <div className={`grid sm:grid-cols-2 lg:grid-cols-3 ${GRID_GAP}`}>
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              body={feature.body}
            />
          ))}
        </div>
      </Section>

      <Section id="how-it-works" labelledBy="how-heading">
        <SectionHeader
          eyebrow="How it works"
          id="how-heading"
          title="Add a game to your app"
          lead="Four steps from install to a reported result."
        />
        <ol className={`grid sm:grid-cols-2 lg:grid-cols-4 ${GRID_GAP}`}>
          {STEPS.map((step, index) => (
            <li key={step.title} className={`${CARD} ${CARD_PAD}`}>
              <span className={`mb-4 flex h-8 w-8 items-center justify-center rounded-lg border font-mono text-xs font-semibold ${ACCENT_SOFT}`}>
                {index + 1}
              </span>
              <h3 className={`mb-2 ${H4_CARD}`}>{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="faq" labelledBy="faq-heading">
        <SectionHeader eyebrow="FAQ" id="faq-heading" title="Frequently asked questions" />
        <FaqList faqs={FAQS} />
      </Section>

      <CtaPanel
        title="Drop a game into your app"
        lead="Install the package, render one component and get a result when the run ends."
      >
        <Link href="/game-engine/installation" className={BUTTON_PRIMARY}>
          <Package aria-hidden className="mr-2 h-5 w-5" />
          Get started
        </Link>
        <Link href="/games/build-a-game" className={BUTTON_SECONDARY}>
          <Code2 aria-hidden className="mr-2 h-5 w-5" />
          Build a game
        </Link>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={BUTTON_SECONDARY}>
          <Github aria-hidden className="mr-2 h-5 w-5" />
          View source
        </a>
        <a href={NPM_URL} target="_blank" rel="noopener noreferrer" className={BUTTON_SECONDARY}>
          <Package aria-hidden className="mr-2 h-5 w-5" />
          npm
        </a>
      </CtaPanel>
    </>
  );
};

export default GamesMain;
