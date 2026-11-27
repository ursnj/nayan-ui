"use client";

import { NImage, NView, NText } from 'nayan-ui/components';
import { createContext, useContext } from "react";
import dynamic from "next/dynamic";
import type { GameSessionProps } from "./GameSession";

const LoadingGame = createContext<Pick<GameSessionProps, "gameId" | "title"> | null>(null);

function GameBootLoader() {
  const game = useContext(LoadingGame);
  if (!game) return null;
  return (
    <NView tag="div"
      className="absolute inset-0 flex flex-col items-center justify-center bg-background px-6 text-center"
      role="progressbar"
      aria-label={`${game.title}. Loading`}
    >
      <NView tag="div" aria-hidden className="pointer-events-none absolute inset-0">
        <NView tag="div" className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.07] to-transparent" />
        <NView tag="div" className="absolute left-1/2 top-1/4 h-64 w-[28rem] max-w-full -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
      </NView>
      <NImage
        src={`/games/${game.gameId}.png`}
        alt=""
        width={112}
        height={112}
        priority
        className="relative size-28 rounded-3xl border border-default object-cover shadow-xl shadow-indigo-500/20 ring-8 ring-indigo-500/10"
      />
      <NText tag="p" className="relative mt-7 text-2xl font-bold tracking-tight text-foreground">
        {game.title}
      </NText>
      <NView tag="div" className="nyn-game-boot-dots flex gap-2 [margin:24px_0_14px] [&_span]:w-2 [&_span]:h-2 [&_span]:rounded-full [&_span]:[background:var(--color-indigo-500,_#6366f1)] [&_span]:animate-game-boot [&_span:nth-child(2)]:[animation-delay:0.15s] [&_span:nth-child(3)]:[animation-delay:0.3s] motion-reduce:[&_span]:[animation:none] relative" aria-hidden="true">
        <NText tag="span" />
        <NText tag="span" />
        <NText tag="span" />
      </NView>
      <NText tag="p" className="relative text-sm text-muted">Loading the game engine…</NText>
    </NView>
  );
}

// The engine needs browser rendering and audio APIs; keep it out of server rendering.
const GameSession = dynamic(() => import("./GameSession"), {
  ssr: false,
  loading: GameBootLoader,
});

export default function GamePlayer(props: GameSessionProps) {
  return (
    <LoadingGame.Provider value={props}>
      <GameSession {...props} />
    </LoadingGame.Provider>
  );
}
