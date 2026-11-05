import { type ComponentType, createElement, memo, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { GameSettingsModal } from '../../helpers/GameSettingsModal';
import { GameThemeProvider } from '../../helpers/GameTheme';
import { GameAssetLoader } from '../../services/GameAssetLoader';
import { areGameAssetsReady, gameAssetStages } from '../../services/GameAssets';
import { DEFAULT_GAME_SETTINGS, type GAME_IDS, type GameProps } from '../../services/UtilsService';
import { EngineReadyContext } from './EngineReadyContext';
import { GameLoading } from './GameLoading';
import { GameLoadingTransition } from './GameLoadingTransition';

/** The game module and its world are evaluated after the native loading animation is visible. */
export function withGameLoading(id: GAME_IDS, load: () => ComponentType<GameProps>): ComponentType<GameProps> {
  let loaded: ComponentType<GameProps> | undefined;
  const GameWithLoading = memo(function GameWithLoading(props: GameProps) {
    const settings = { ...DEFAULT_GAME_SETTINGS, ...props.settings };
    const [Game, setGame] = useState<ComponentType<GameProps> | undefined>(() => (areGameAssetsReady(id, settings.theme) ? loaded : undefined));
    const [label, setLabel] = useState('Getting ready');
    const [error, setError] = useState(false);
    const loading = useRef<GameAssetLoader | null>(null);
    const failed = useRef(false);
    // Informational panels pause gameplay, but assets keep preparing behind them.
    useEffect(() => {
      if (Game) return;
      failed.current = false;
      setError(false);
      const began = performance.now();
      const session = new GameAssetLoader(
        [
          ...gameAssetStages(id, settings.theme),
          {
            label: 'Ready for playtime',
            *tasks() {
              yield () => {
                loaded = load();
              };
            }
          }
        ],
        setLabel,
        () => {
          if (typeof __DEV__ !== 'undefined' && __DEV__) console.log(`[loader] ${id} ready in ${(performance.now() - began).toFixed(0)} ms`);
          setGame(() => loaded);
        },
        (failure) => {
          console.warn(`Unable to load ${id}:`, failure);
          failed.current = true;
          setError(true);
        }
      );
      session.name = id;
      loading.current = session;
      const sync = () => {
        if (AppState.currentState === 'active' && !failed.current) session.start();
        else session.pause();
      };
      const app = AppState.addEventListener('change', sync);
      sync();
      return () => {
        session.dispose();
        loading.current = null;
        app.remove();
      };
    }, [Game, settings.theme]);
    // Settings remain available while loading.
    const Settings = !Game && settings.isVisible ? GameSettingsModal : null;
    return (
      <GameThemeProvider theme={settings.theme}>
        <GameLoadingTransition
          ready={!!Game}
          loader={
            <GameLoading
              gameId={id}
              theme={settings.theme}
              offset={settings.offset}
              visible={!settings.isVisible}
              label={label}
              error={error}
              onRetry={() => {
                failed.current = false;
                setError(false);
                if (AppState.currentState === 'active') loading.current?.start();
              }}
            />
          }>
          {Game && <EngineReadyContext.Provider value={true}>{createElement(Game, props)}</EngineReadyContext.Provider>}
        </GameLoadingTransition>
        {Settings && <Settings gameId={id} settings={settings} onSettingsChange={props.onSettingsChange} />}
      </GameThemeProvider>
    );
  });
  GameWithLoading.displayName = `Loading(${id})`;
  return GameWithLoading;
}
