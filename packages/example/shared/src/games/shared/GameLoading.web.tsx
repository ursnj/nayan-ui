import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useElementSize } from './useElementSize';
import { type Font, GameView, isEngineAvailable, warmUpEngine } from '@nayan-ui/engine';
import { GAMES_METADATA } from '../../services/GamesMetadata';
import { resolveGameTheme } from '../../services/ThemeService';
import type { GAME_IDS, GameThemeMode } from '../../services/UtilsService';
import { loadHudFonts } from './EngineHud';
import { EngineLoading, LOADING_LIGHT, loadingLook, loadingPlacement } from './EngineLoading';
import { useGameResource } from './useGameResource';

interface GameLoadingProps {
  gameId: GAME_IDS;
  theme?: GameThemeMode;
  label?: string;
  error?: boolean;
  message?: string;
  onRetry?: () => void;
  offset?: number;
  visible?: boolean;
}
interface LoadingViewProps extends GameLoadingProps {
  font: Font;
  width: number;
  height: number;
  reducedMotion: boolean;
  onFailure: () => void;
}
const LoadingView = memo(function LoadingView({
  gameId,
  theme,
  font,
  width,
  height,
  offset = 0,
  label = 'Getting ready',
  error = false,
  message,
  onRetry,
  visible = true,
  reducedMotion,
  onFailure
}: LoadingViewProps) {
  const scene = useGameResource(
    () => new EngineLoading(gameId, theme, font),
    (value) => () => value.dispose()
  );
  useEffect(() => scene.layout(width, height, offset), [scene, width, height, offset]);
  useEffect(
    () => scene.setStatus({ label, error, message, retry: !!onRetry, reducedMotion }),
    [scene, label, error, message, onRetry, reducedMotion]
  );
  const update = useCallback((dt: number) => scene.update(dt), [scene]);
  const retry = useRef(onRetry);
  retry.current = onRetry;
  const tap = useCallback(
    (x: number, y: number) => {
      const box = scene.retryBounds;
      if (error && x >= box.left && x <= box.left + box.width && y >= box.top && y <= box.top + box.height) retry.current?.();
    },
    [scene, error]
  );
  // This transparent control supplies keyboard/screen-reader access; all visible pixels are engine-drawn.
  const { retryBounds } = loadingPlacement(width, height, offset);
  return (
    <>
      <GameView
        source={scene.world}
        camera={scene.camera}
        light={LOADING_LIGHT}
        background={scene.clearColor}
        onUpdate={update}
        paused={!visible}
        onTap={tap}
        onError={onFailure}
        style={{ position: 'absolute', inset: 0 }}
      />
      {visible && error && onRetry && (
        <button type="button" aria-label="Try again" onClick={onRetry} style={{ position: 'absolute', ...retryBounds, border: 0, background: 'transparent', cursor: 'pointer' }} />
      )}
    </>
  );
});

/** Shared engine loading world; only engine-unavailable/bootstrap failures use the text fallback. */
export const GameLoading = memo(function GameLoading({
  gameId,
  theme,
  label = 'Getting ready',
  error = false,
  message,
  onRetry,
  offset = 0,
  visible = true
}: GameLoadingProps) {
  const colors = resolveGameTheme(theme);
  const look = loadingLook(gameId, theme);
  const title = GAMES_METADATA[gameId].title;
  const [root, size] = useElementSize();
  const [font, setFont] = useState<Font | null>(null);
  const [failed, setFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    if (font || !visible || !isEngineAvailable || failed) return;
    let alive = true;
    void warmUpEngine()
      .then(loadHudFonts)
      .then(
        (fonts) => {
          if (alive) setFont(fonts.semi);
        },
        () => {
          if (alive) setFailed(true);
        }
      );
    return () => {
      alive = false;
    };
  }, [font, visible, failed]);
  const failure = useCallback(() => setFailed(true), []);
  const ready = !!font && !!size && size.width > 0 && size.height > 0 && !failed;
  return (
    <div ref={root} data-testid="game-loading"
      style={{ position: 'relative', display: 'flex', flex: 1, backgroundColor: look.colours.sky }}
      aria-live="polite" role={error ? 'alert' : 'progressbar'} aria-busy={!error}
      aria-label={`${title}. ${error ? (message ?? 'Unable to prepare this game') : label}`}>
      {ready ? (
        <LoadingView
          key={`${gameId}:${theme}`}
          gameId={gameId}
          theme={theme}
          font={font}
          width={size.width}
          height={size.height}
          label={label}
          error={error}
          message={message}
          onRetry={onRetry}
          offset={offset}
          visible={visible}
          reducedMotion={reducedMotion}
          onFailure={failure}
        />
      ) : (
        visible && (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 24, paddingTop: offset }}>
            <h2 style={{ color: colors.TEXT, fontSize: 24, fontWeight: 600 }}>{title}</h2>
            <p role={error ? 'alert' : 'status'} style={{ color: colors.TEXT_SUBTLE, fontSize: 16 }}>
              {error ? (message ?? 'Unable to prepare this game.') : `${label}…`}
            </p>
            {error && onRetry && (
              <button type="button" onClick={onRetry}
                style={{ marginTop: 20, padding: '12px 20px', borderRadius: 12, border: 0, backgroundColor: colors.SOLID, color: colors.ON_SOLID, cursor: 'pointer' }}>
                Try again
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
});
