import { useEffect, useRef } from 'react';
import { GameView } from '@nayan-ui/engine';
import { FOG, LIGHT, LIVES, SKY, useCarRacing } from '@nayan-engine-example/shared/car-racing';
import { sources } from './CarRacingAssets';

const KEYS: Record<string, number> = { ArrowLeft: -1, a: -1, A: -1, ArrowRight: 1, d: 1, D: 1 };

export default function CarRacing() {
  const racing = useCarRacing(sources);
  const surface = useRef<HTMLElement>(null);

  // Arrow keys or A/D steer while held.
  useEffect(() => {
    const held = new Set<number>();
    const key = (event: KeyboardEvent) => {
      const direction = KEYS[event.key];
      if (direction === undefined) return;
      event.preventDefault();
      if (event.type === 'keydown') held.add(direction);
      else held.delete(direction);
      racing.steer((held.has(1) ? 1 : 0) - (held.has(-1) ? 1 : 0));
    };
    window.addEventListener('keydown', key);
    window.addEventListener('keyup', key);
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('keyup', key);
    };
  }, [racing.steer]);

  const over = racing.phase === 'won' || racing.phase === 'lost';
  return (
    <main ref={surface} className="relative h-dvh w-full select-none text-white">
      {racing.world && racing.game && (
        <GameView
          source={racing.world}
          camera={racing.game.camera}
          light={LIGHT}
          background={SKY}
          fog={FOG}
          paused={racing.paused}
          onUpdate={racing.update}
          onDrag={(event) => racing.drag(event, surface.current?.clientWidth ?? 1)}
          onError={(error) => console.error(error)}
          style={{ position: 'absolute', inset: 0 }}
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4 text-sm font-semibold drop-shadow">
        <div className="flex gap-6">
          <Stat label="Score" value={racing.score.toLocaleString()} />
          <Stat label="Lives" value={'♥'.repeat(racing.lives) + '♡'.repeat(Math.max(0, LIVES - racing.lives))} />
          <Stat label="To finish" value={`${racing.left} m`} />
        </div>
        <div className="pointer-events-auto flex gap-2">
          <Button onClick={racing.toggleMute}>{racing.muted ? 'Sound off' : 'Sound on'}</Button>
          {racing.phase === 'playing' && (
            <Button onClick={() => racing.setPaused(!racing.paused)}>{racing.paused ? 'Resume' : 'Pause'}</Button>
          )}
        </div>
      </div>

      {racing.phase !== 'playing' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/30">
          {racing.error ? (
            <p role="alert">{racing.error}</p>
          ) : (
            <>
              <h1 className="text-4xl font-bold">
                {racing.phase === 'won' ? 'Finished!' : racing.phase === 'lost' ? 'Crashed out' : 'Car Racing'}
              </h1>
              {over && <p className="text-lg">Score {racing.score.toLocaleString()}</p>}
              <Button onClick={racing.start} disabled={!racing.game}>
                {!racing.game ? 'Loading…' : over ? 'Race again' : 'Start race'}
              </Button>
              <p className="text-sm opacity-80">← → or A D to steer · or drag the road</p>
            </>
          )}
        </div>
      )}
    </main>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-[11px] uppercase tracking-widest opacity-80">{label}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

const Button = ({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: string }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="rounded-xl bg-white/90 px-5 py-2.5 font-semibold text-slate-900 shadow disabled:opacity-60"
  >
    {children}
  </button>
);
