"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { GAME_IDS } from "@nayan-ui/games/services";
import GamePanel from "./GamePanel";
import GamePlayer from "./GamePlayer";

const GUIDE_HASH = "#game-guide";

interface GameExperienceProps {
  gameId: GAME_IDS;
  title: string;
  description: string;
  /** The game's guide, server-rendered into the side panel. */
  children: ReactNode;
}

/**
 * The full-height play area under the site header, with the game's guide in a side panel.
 * `/games/<id>#game-guide` opens the guide directly.
 */
export default function GameExperience({
  gameId,
  title,
  description,
  children,
}: GameExperienceProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  const showInfo = useCallback(() => setInfoOpen(true), []);
  const closeInfo = useCallback(() => {
    setInfoOpen(false);
    if (window.location.hash === GUIDE_HASH)
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search,
      );
  }, []);

  useEffect(() => {
    const openLinkedGuide = () => {
      if (window.location.hash === GUIDE_HASH) setInfoOpen(true);
    };
    openLinkedGuide();
    window.addEventListener("hashchange", openLinkedGuide);
    return () => window.removeEventListener("hashchange", openLinkedGuide);
  }, []);

  return (
    <div className="nyn-game-page fixed inset-x-0 bottom-0 top-[60px] z-30 bg-background">
      <h1 className="sr-only">Play {title}</h1>
      <p className="sr-only">{description}</p>
      <GamePlayer
        key={gameId}
        gameId={gameId}
        title={title}
        panelOpen={infoOpen}
        onShowInfo={showInfo}
      />
      <GamePanel title={title} label="How to play" open={infoOpen} onClose={closeInfo}>
        {children}
      </GamePanel>
    </div>
  );
}
