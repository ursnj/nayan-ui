import type { PointerEvent as ReactPointerEvent } from 'react';

type Touch = { pageX: number; pageY: number };
interface Event {
  nativeEvent: Touch & {
    locationX: number;
    locationY: number;
    touches: Touch[];
  };
}
interface Gesture {
  dx: number;
  dy: number;
}
interface Callbacks {
  onStartShouldSetPanResponder: () => boolean;
  onMoveShouldSetPanResponder: () => boolean;
  onPanResponderGrant: (event: Event) => void;
  onPanResponderMove: (event: Event, gesture: Gesture) => void;
  onPanResponderRelease: (event: Event, gesture: Gesture) => void;
  onPanResponderTerminate: (event: Event, gesture: Gesture) => void;
}
export interface PanResponderInstance {
  panHandlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onLostPointerCapture: (event: ReactPointerEvent<HTMLDivElement>) => void;
  };
  cancel: () => void;
}

/** Adapt DOM pointer capture to the gesture recognizer used on mobile. Coordinates stay in CSS pixels. */
export const PanResponder = {
  create(callbacks: Callbacks): PanResponderInstance {
    const pointers = new Map<number, Touch>();
    let origin = { x: 0, y: 0 };
    let last: Event = {
      nativeEvent: {
        pageX: 0,
        pageY: 0,
        locationX: 0,
        locationY: 0,
        touches: []
      }
    };
    let gesture = { dx: 0, dy: 0 };
    let primary = -1;
    const event = (e: ReactPointerEvent<HTMLDivElement>): Event => {
      const rect = e.currentTarget.getBoundingClientRect();
      const nativeEvent = {
        pageX: e.clientX,
        pageY: e.clientY,
        locationX: e.clientX - rect.left,
        locationY: e.clientY - rect.top,
        touches: [...pointers.values()]
      };
      if (e.pointerId === primary) gesture = { dx: e.clientX - origin.x, dy: e.clientY - origin.y };
      return (last = { nativeEvent });
    };
    const cancel = () => {
      if (pointers.size) callbacks.onPanResponderTerminate(last, gesture);
      pointers.clear();
      primary = -1;
    };
    return {
      cancel,
      panHandlers: {
        onPointerDown(e) {
          if (e.button !== 0) return;
          e.preventDefault();
          // Keyboard pointers already retain their target; only physical pointers can be captured.
          if (e.isTrusted) e.currentTarget.setPointerCapture(e.pointerId);
          pointers.set(e.pointerId, { pageX: e.clientX, pageY: e.clientY });
          if (pointers.size === 1) {
            primary = e.pointerId;
            origin = { x: e.clientX, y: e.clientY };
            gesture = { dx: 0, dy: 0 };
            callbacks.onPanResponderGrant(event(e));
          } else callbacks.onPanResponderMove(event(e), gesture);
        },
        onPointerMove(e) {
          if (!pointers.has(e.pointerId)) return;
          pointers.set(e.pointerId, { pageX: e.clientX, pageY: e.clientY });
          callbacks.onPanResponderMove(event(e), gesture);
        },
        onPointerUp(e) {
          if (!pointers.has(e.pointerId)) return;
          const current = event(e);
          if (e.pointerId === primary || pointers.size >= 2) {
            callbacks.onPanResponderRelease(current, gesture);
            pointers.clear();
            primary = -1;
          } else pointers.delete(e.pointerId);
        },
        onPointerCancel: cancel,
        onLostPointerCapture(e) {
          if (pointers.has(e.pointerId)) cancel();
        }
      }
    };
  }
};
