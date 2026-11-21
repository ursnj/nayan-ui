import type { DragEvent, OverlayTouchPhase, PinchEvent, SwipeDirection } from './GameView';
// Gesture recognition for GameView: tap, swipe, drag, long press, pinch.
import { PanResponder, type PanResponderInstance } from './responder';

const TAP_SLOP = 10; // points a finger may wander and still tap
const TAP_TIME = 300; // ms
const SWIPE_DISTANCE = 30; // points
const SWIPE_SPEED = 0.3; // points per ms
const LONG_PRESS_TIME = 500; // ms

type Handlers = {
  onTap?: (x: number, y: number) => void;
  onSwipe?: (direction: SwipeDirection) => void;
  onDrag?: (drag: DragEvent) => void;
  onLongPress?: (x: number, y: number) => void;
  onPinch?: (pinch: PinchEvent) => void;
  onOverlayTouch?: (phase: OverlayTouchPhase, x: number, y: number) => boolean | void;
};

/**
 * Creates a PanResponder that recognizes taps, swipes, drags, long presses and pinches.
 * `getHandlers` is called on each event so the caller can swap handlers without recreating the responder.
 */
export function createTouchResponder(getHandlers: () => Handlers): {
  responder: PanResponderInstance;
  dispose: () => void;
  cancel: () => void;
} {
  let start = { x: 0, y: 0, time: 0 };
  let origin = { x: 0, y: 0 };
  let mode: 'drag' | 'pinch' | 'overlay' | 'none' = 'none';
  let pinch0 = { distance: 1, angle: 0 };
  let lastPinch: PinchEvent = {
    phase: 'end',
    scale: 1,
    rotation: 0,
    x: 0,
    y: 0
  };
  let longPress: ReturnType<typeof setTimeout> | undefined;
  let longPressed = false;

  const drag = (phase: DragEvent['phase'], x: number, y: number, cancelled?: boolean) =>
    getHandlers().onDrag?.({
      phase,
      x,
      y,
      dx: x - start.x,
      dy: y - start.y,
      ...(cancelled && { cancelled })
    });

  type Touch = { pageX: number; pageY: number };

  const twoFingers = (touches: readonly Touch[], phase: PinchEvent['phase']) => {
    const [a, b] = touches as [Touch, Touch];
    const distance = Math.max(1, Math.hypot(b.pageX - a.pageX, b.pageY - a.pageY));
    const angle = Math.atan2(b.pageY - a.pageY, b.pageX - a.pageX);
    if (phase === 'start') pinch0 = { distance, angle };
    lastPinch = {
      phase,
      scale: distance / pinch0.distance,
      rotation: angle - pinch0.angle,
      x: (a.pageX + b.pageX) / 2 - origin.x,
      y: (a.pageY + b.pageY) / 2 - origin.y
    };
    getHandlers().onPinch?.(lastPinch);
  };

  const stopLongPress = () => {
    clearTimeout(longPress);
    longPress = undefined;
  };

  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const { locationX, locationY, pageX, pageY } = e.nativeEvent;
      start = { x: locationX, y: locationY, time: Date.now() };
      origin = { x: pageX - locationX, y: pageY - locationY };
      if (getHandlers().onOverlayTouch?.('start', start.x, start.y) === true) {
        mode = 'overlay';
        return;
      }
      mode = 'drag';
      longPressed = false;
      drag('start', start.x, start.y);
      if (getHandlers().onLongPress) {
        longPress = setTimeout(() => {
          longPress = undefined;
          if (mode !== 'drag') return;
          longPressed = true;
          getHandlers().onLongPress?.(start.x, start.y);
        }, LONG_PRESS_TIME);
      }
    },
    onPanResponderMove: (e, g) => {
      if (mode === 'overlay') {
        getHandlers().onOverlayTouch?.('move', start.x + g.dx, start.y + g.dy);
        return;
      }
      const touches = e.nativeEvent.touches;
      if (touches.length >= 2 && getHandlers().onPinch) {
        if (mode === 'drag') {
          stopLongPress();
          drag('end', start.x + g.dx, start.y + g.dy, true);
          mode = 'pinch';
          twoFingers(touches, 'start');
        } else if (mode === 'pinch') {
          twoFingers(touches, 'move');
        }
        return;
      }
      if (mode !== 'drag') return;
      if (Math.hypot(g.dx, g.dy) >= TAP_SLOP) stopLongPress();
      drag('move', start.x + g.dx, start.y + g.dy);
    },
    onPanResponderRelease: (_, g) => {
      stopLongPress();
      const was = mode;
      mode = 'none';
      if (was === 'none') return;
      if (was === 'overlay') {
        getHandlers().onOverlayTouch?.('end', start.x + g.dx, start.y + g.dy);
        return;
      }
      if (was === 'pinch') {
        getHandlers().onPinch?.({ ...lastPinch, phase: 'end' });
        return;
      }
      const x = start.x + g.dx;
      const y = start.y + g.dy;
      drag('end', x, y);
      if (longPressed) return;
      const { onTap, onSwipe } = getHandlers();
      const distance = Math.hypot(g.dx, g.dy);
      const time = Date.now() - start.time;
      if (distance < TAP_SLOP && time < TAP_TIME) onTap?.(start.x, start.y);
      else if (distance > SWIPE_DISTANCE && distance / Math.max(1, time) > SWIPE_SPEED) {
        onSwipe?.(Math.abs(g.dx) > Math.abs(g.dy) ? (g.dx > 0 ? 'right' : 'left') : g.dy > 0 ? 'down' : 'up');
      }
    },
    onPanResponderTerminate: (_, g) => {
      stopLongPress();
      const was = mode;
      mode = 'none';
      if (was === 'overlay') getHandlers().onOverlayTouch?.('cancel', start.x + g.dx, start.y + g.dy);
      else if (was === 'pinch') getHandlers().onPinch?.({ ...lastPinch, phase: 'end' });
      else if (was === 'drag') drag('end', start.x + g.dx, start.y + g.dy, true);
    }
  });

  const cancel = () => {
    (responder as PanResponderInstance & { cancel?: () => void }).cancel?.();
    stopLongPress();
    const was = mode;
    mode = 'none';
    if (was === 'overlay') getHandlers().onOverlayTouch?.('cancel', start.x, start.y);
    else if (was === 'pinch') getHandlers().onPinch?.({ ...lastPinch, phase: 'end' });
    else if (was === 'drag') drag('end', start.x, start.y, true);
  };
  return { responder, dispose: cancel, cancel };
}

// Re-export threshold constants for testing.
export { TAP_SLOP, TAP_TIME, SWIPE_DISTANCE, SWIPE_SPEED, LONG_PRESS_TIME };
