"use client";

import { createContext, useContext } from "react";
import dynamic from "next/dynamic";
import type { GameSessionProps } from "./GameSession";

const LoadingGame = createContext<Pick<GameSessionProps, "gameId" | "title"> | null>(null);

function GameBootLoader() {
  const game = useContext(LoadingGame);
  if (!game) return null;
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-background px-6 text-center"
      role="progressbar"
      aria-label={`${game.title}. Loading`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.07] to-transparent" />
        <div className="absolute left-1/2 top-1/4 h-64 w-[28rem] max-w-full -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>
      <img
        src={`/games/${game.gameId}.png`}
        alt=""
        width={112}
        height={112}
        fetchPriority="high"
        className="relative size-28 rounded-3xl border border-default object-cover shadow-xl shadow-indigo-500/20 ring-8 ring-indigo-500/10"
      />
      <p className="relative mt-7 text-2xl font-bold tracking-tight text-foreground">
        {game.title}
      </p>
      <div className="nyn-game-boot-dots relative" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="relative text-sm text-muted">Loading the game engine…</p>
    </div>
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
