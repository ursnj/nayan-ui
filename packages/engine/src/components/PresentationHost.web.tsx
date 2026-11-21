import { reducedMotionQuery } from '../native/reducedMotion.web';
import { useEffect, useMemo, useRef, useState } from 'react';
import { NPlatformView } from './NPlatformView';
import { NToastHost } from './NToastHost';
import type { PresentationHostProps } from './PresentationTypes';
import { PresentationGestureContext } from './theme/contexts';
import { ToastHostOwnershipContext } from './ThemeServices';

export function usePresentationSize() {
  const [size, setSize] = useState(() => ({
    width: typeof window === 'undefined' ? 1024 : window.innerWidth,
    height: typeof window === 'undefined' ? 768 : (window.visualViewport?.height ?? window.innerHeight)
  }));
  useEffect(() => {
    const resize = () => setSize({ width: window.innerWidth, height: window.visualViewport?.height ?? window.innerHeight });
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
    };
  }, []);
  return size;
}

export function PresentationHost(props: PresentationHostProps) {
  return (
    <NPlatformView style={{ position: 'fixed', inset: 0, width: '100%', height: '100dvh' }}>
      <BrowserPresentation {...props} />
    </NPlatformView>
  );
}

function BrowserPresentation({
  children,
  sheet,
  height,
  width,
  border,
  background,
  onClose,
  backdrop,
  bottomInset = 16,
  handleColor = '#a1a1aa',
  swipeable = false,
  dragAreaHeight = 112,
  dismissible = true,
  ready = true
}: PresentationHostProps) {
  const modal = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const viewport = usePresentationSize();
  const drag = useRef<{
    x: number;
    y: number;
    time: number;
    distance: number;
    pointerId: number;
    active: boolean;
    allowed: boolean;
    target: Element | null;
  } | null>(null);
  const fadeAnimation = useRef<Animation | null>(null);
  const cancellingTap = useRef(false);
  const cancellations = useRef(new Map<() => void, ((x: number, y: number) => boolean | Promise<boolean>) | undefined>());
  const gestures = useMemo(
    () => ({
      register(cancel: () => void, canStart?: (x: number, y: number) => boolean | Promise<boolean>) {
        cancellations.current.set(cancel, canStart);
        return () => {
          cancellations.current.delete(cancel);
        };
      }
    }),
    []
  );
  const current = useRef({ height, onClose });
  current.current = { height, onClose };
  const motion = () => window.matchMedia(reducedMotionQuery).matches;

  useEffect(() => {
    const element = modal.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element?.showModal();
    return () => {
      element?.close();
      previous?.focus();
    };
  }, []);

  useEffect(() => {
    const element = scrim.current;
    if (!sheet || !element) return;
    if (motion() || !element.animate) {
      element.style.opacity = '1';
      return;
    }
    const animation = element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out', fill: 'forwards' });
    fadeAnimation.current = animation;
    void animation.finished.catch(() => {});
    return () => animation.cancel();
  }, [sheet]);

  useEffect(() => {
    if (!sheet || !ready || motion()) return;
    const animation = panel.current?.animate?.([{ transform: 'translateY(48px)' }, { transform: 'translateY(0)' }], {
      duration: 240,
      easing: 'cubic-bezier(.22,1,.36,1)'
    });
    void animation?.finished.catch(() => {});
    return () => animation?.cancel();
  }, [sheet, ready]);

  const settle = (dismiss: boolean) => {
    const element = panel.current;
    const distance = drag.current?.distance ?? 0;
    drag.current = null;
    if (!element) return;
    const finish = () => {
      if (scrim.current) scrim.current.style.opacity = dismiss ? '0' : '1';
      if (dismiss) current.current.onClose();
      else element.style.transform = '';
    };
    const duration = motion() ? 0 : 180;
    const animation = element.animate?.(
      [{ transform: `translateY(${distance}px)` }, { transform: `translateY(${dismiss ? current.current.height : 0}px)` }],
      { duration, easing: 'ease-out', fill: 'forwards' }
    );
    const fade = scrim.current?.animate?.([{ opacity: Number(scrim.current.style.opacity) }, { opacity: dismiss ? 0 : 1 }], {
      duration,
      fill: 'forwards'
    });
    void fade?.finished.catch(() => {});
    if (!animation) {
      fade?.cancel();
      finish();
    } else
      void animation.finished.then(
        () => {
          if (element.isConnected) finish();
          animation.cancel();
          fade?.cancel();
        },
        () => {
          fade?.cancel();
        }
      );
  };

  return (
    <dialog
      ref={modal}
      data-nayan-modal={sheet ? 'sheet' : 'dialog'}
      aria-label={sheet ? 'Sheet' : 'Dialog'}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        margin: 0,
        padding: 0,
        border: 0,
        width: '100%',
        height: viewport.height,
        maxWidth: 'none',
        maxHeight: 'none',
        background: 'transparent',
        display: 'flex',
        justifyContent: 'center',
        alignItems: sheet ? 'flex-end' : 'center'
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && dismissible) onClose();
      }}>
      <style>{'dialog[data-nayan-modal="sheet"]::backdrop { background: transparent; }'}</style>
      <div
        ref={scrim}
        data-nayan-backdrop
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, background: 'rgba(10,7,24,0.48)', opacity: sheet ? 0 : 1, pointerEvents: 'none' }}
      />
      <div
        ref={panel}
        data-nayan-presentation={sheet ? 'sheet' : 'dialog'}
        onPointerDownCapture={(event) => {
          if (!event.isPrimary) {
            if (drag.current?.active) settle(false);
            else drag.current = null;
            return;
          }
          if (!sheet || !swipeable || !dismissible || !ready || event.button !== 0 || drag.current) return;
          const element = event.target instanceof Element ? event.target : null;
          if (element?.closest('input,textarea,select,[contenteditable="true"]')) return;
          const offset = event.clientY - event.currentTarget.getBoundingClientRect().top;
          if (offset < 0 || offset > height) return;
          const checks: (boolean | Promise<boolean>)[] = [];
          if (offset > dragAreaHeight) {
            for (let ancestor = element; ancestor && ancestor !== event.currentTarget; ancestor = ancestor.parentElement) {
              if (ancestor instanceof HTMLElement && ancestor.scrollTop > 0.5) return;
            }
            for (const canStart of cancellations.current.values()) checks.push(canStart?.(event.clientX, event.clientY) ?? true);
            if (checks.some((check) => check === false)) return;
          }
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            time: performance.now(),
            distance: 0,
            pointerId: event.pointerId,
            active: false,
            allowed: checks.every((check) => check === true),
            target: element
          };
          const state = drag.current;
          if (!state.allowed)
            void Promise.all(checks).then(
              (checks) => {
                if (drag.current === state) {
                  if (checks.every(Boolean)) state.allowed = true;
                  else drag.current = null;
                }
              },
              () => {
                if (drag.current === state) drag.current = null;
              }
            );
        }}
        onPointerMoveCapture={(event) => {
          const state = drag.current;
          if (!state || state.pointerId !== event.pointerId) return;
          const distance = Math.max(0, event.clientY - state.y);
          if (!state.active) {
            const dx = Math.abs(event.clientX - state.x);
            if (Math.max(Math.abs(event.clientY - state.y), dx) <= 6) return;
            if (distance <= dx) {
              drag.current = null;
              return;
            }
            if (!state.allowed) return;
          }
          if (!state.active) {
            state.active = true;
            for (const cancel of cancellations.current.keys()) cancel();
            // Cancel a pending Rust tap before taking pointer capture from its canvas.
            cancellingTap.current = true;
            try {
              state.target?.dispatchEvent(
                new PointerEvent('pointercancel', { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY })
              );
            } finally {
              cancellingTap.current = false;
            }
            event.currentTarget.setPointerCapture(event.pointerId);
            fadeAnimation.current?.cancel();
          }
          event.preventDefault();
          event.stopPropagation();
          state.distance = distance;
          event.currentTarget.style.transform = `translateY(${distance}px)`;
          if (scrim.current) scrim.current.style.opacity = String(Math.max(0, 1 - distance / height));
        }}
        onPointerUpCapture={(event) => {
          const state = drag.current;
          if (!state || state.pointerId !== event.pointerId) return;
          if (!state.active) {
            drag.current = null;
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          const velocity = state.distance / Math.max(1, performance.now() - state.time);
          settle(state.distance > Math.min(96, Math.max(48, height * 0.2)) || (state.distance > 16 && velocity > 0.8));
        }}
        onPointerCancel={(event) => {
          if (cancellingTap.current) return;
          if (drag.current?.pointerId !== event.pointerId) return;
          if (drag.current.active) settle(false);
          else drag.current = null;
        }}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          flexShrink: 0,
          height,
          width,
          maxHeight: '100%',
          overflow: 'hidden',
          borderRadius: sheet ? '28px 28px 0 0' : 22,
          border: `1px solid ${border}`,
          borderBottomWidth: sheet ? 0 : 1,
          background,
          paddingBottom: sheet ? bottomInset : 0,
          opacity: ready ? 1 : 0,
          pointerEvents: ready ? 'auto' : 'none',
          boxShadow: sheet ? '0 -16px 48px rgba(0,0,0,.2)' : undefined
        }}>
        {backdrop}
        {sheet && (
          <div
            aria-hidden="true"
            data-sheet-handle
            style={{
              height: swipeable ? 32 : 16,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: swipeable ? 'none' : undefined,
              cursor: swipeable ? 'grab' : undefined
            }}>
            {swipeable && <div style={{ width: 36, height: 5, borderRadius: 3, background: handleColor, opacity: 0.5 }} />}
          </div>
        )}
        <PresentationGestureContext.Provider value={gestures}>
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0, position: 'relative' }}>{children}</div>
        </PresentationGestureContext.Provider>
      </div>
      <ToastHostOwnershipContext.Provider value={null}>
        <NToastHost />
      </ToastHostOwnershipContext.Provider>
    </dialog>
  );
}
