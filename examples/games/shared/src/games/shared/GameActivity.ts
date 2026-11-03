import { createContext, useContext, useLayoutEffect } from 'react';
import type { GameProps } from '../../services/UtilsService';

/** Hosts own navigation; the library reports play state without depending on a navigator. */
export const GamePlayingContext = createContext<GameProps['onPlayingChange']>(undefined);

export function useGamePlaying(playing: boolean) {
  const changed = useContext(GamePlayingContext);
  useLayoutEffect(() => {
    changed?.(playing);
    return () => changed?.(false);
  }, [changed, playing]);
}
