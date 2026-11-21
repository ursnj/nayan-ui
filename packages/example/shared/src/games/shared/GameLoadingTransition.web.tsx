import { memo, type ReactNode, useEffect, useRef, useState } from 'react';

interface GameLoadingTransitionProps {
  ready: boolean;
  loader: ReactNode;
  children: ReactNode;
}

/** Keep the loading surface over the first game frame, respecting reduced motion. */
export const GameLoadingTransition = memo(function GameLoadingTransition({ ready, loader, children }: GameLoadingTransitionProps) {
  const [visible, setVisible] = useState(!ready);
  const overlay = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ready) {
      setVisible(true);
      return;
    }
    if (!visible) return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        const animation = overlay.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 160,
          fill: 'forwards'
        });
        if (animation) {
          currentAnimation = animation;
          animation.onfinish = () => setVisible(false);
        } else setVisible(false);
      });
    });
    let currentAnimation: Animation | undefined;
    return () => {
      cancelAnimationFrame(frame);
      currentAnimation?.cancel();
    };
  }, [ready, visible]);
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {ready && children}
      {(visible || !ready) && (
        <div ref={overlay} aria-hidden={ready} inert={ready}
          style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: ready ? 'none' : 'auto' }}>
          {loader}
        </div>
      )}
    </div>
  );
});
