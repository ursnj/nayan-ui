import { type ComponentRef, useEffect, useMemo, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  type GestureResponderEvent,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  useWindowDimensions,
  View
} from 'react-native';
import { NToastHost } from './NToastHost';
import type { PresentationHostProps } from './PresentationTypes';
import { PresentationGestureContext } from './theme/contexts';
import { ToastHostOwnershipContext } from './ThemeServices';

export const usePresentationSize = useWindowDimensions;

interface SheetTouch {
  x: number;
  y: number;
  identifier: number;
  distance: number;
  velocity: number;
  lastY: number;
  lastTime: number;
  active: boolean;
}

export function PresentationHost({
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
  const translation = useRef(new Animated.Value(sheet ? height : 0)).current;
  const backdropOpacity = useRef(new Animated.Value(sheet ? 0 : 1)).current;
  const motionPreference = useRef<Promise<boolean> | null>(null);
  const panel = useRef<ComponentRef<typeof View>>(null);
  const touch = useRef({ token: 0, allowed: undefined as boolean | undefined, start: null as SheetTouch | null });
  const closing = useRef(false);
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
  const current = useRef({ height, onClose, swipeable, sheet, dismissible, ready, dragAreaHeight });
  current.current = { height, onClose, swipeable, sheet, dismissible, ready, dragAreaHeight };
  const reducedMotion = useRef(false);
  const alive = useRef(true);

  useEffect(() => {
    let active = true;
    alive.current = true;
    motionPreference.current = sheet ? AccessibilityInfo.isReduceMotionEnabled().catch(() => true) : Promise.resolve(false);
    if (sheet)
      void motionPreference.current.then((reduced) => {
        if (!active) return;
        reducedMotion.current = reduced;
        if (reduced) backdropOpacity.setValue(1);
        else Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    return () => {
      active = false;
      alive.current = false;
      backdropOpacity.stopAnimation();
      translation.stopAnimation();
    };
  }, [sheet, backdropOpacity, translation]);

  useEffect(() => {
    if (!sheet || !ready) return;
    let active = true;
    void motionPreference.current?.then((reduced) => {
      if (!active) return;
      reducedMotion.current = reduced;
      if (reduced) translation.setValue(0);
      else Animated.spring(translation, { toValue: 0, damping: 30, stiffness: 280, mass: 1, useNativeDriver: true }).start();
    });
    return () => {
      active = false;
      translation.stopAnimation();
    };
  }, [sheet, ready, translation]);

  const restore = () => {
    if (reducedMotion.current) {
      translation.setValue(0);
      backdropOpacity.setValue(1);
    } else
      Animated.parallel([
        Animated.spring(translation, { toValue: 0, damping: 30, stiffness: 280, mass: 1, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 160, useNativeDriver: true })
      ]).start();
  };
  const cancelDrag = () => {
    const active = touch.current.start?.active;
    touch.current.start = null;
    touch.current.allowed = undefined;
    ++touch.current.token;
    if (active) restore();
  };
  const startDrag = (event: GestureResponderEvent) => {
    // Observe without taking the responder from native Rust surfaces or pressable children.
    // Some native targets deliver touch moves without responder negotiation callbacks.
    if (touch.current.start) {
      cancelDrag();
      return false;
    }
    const token = ++touch.current.token;
    const { sheet, swipeable, dismissible, ready } = current.current;
    if (!sheet || !swipeable || !dismissible || !ready || closing.current || event.nativeEvent.touches.length !== 1) return false;
    const { pageX: x, pageY: y, identifier, timestamp: time } = event.nativeEvent;
    touch.current.allowed = undefined;
    touch.current.start = { x, y, identifier, distance: 0, velocity: 0, lastY: y, lastTime: time, active: false };
    // locationY belongs to the touched child; measure the panel in the same window as pageY.
    panel.current?.measureInWindow((_x, top) => {
      if (touch.current.token !== token) return;
      const offset = y - top;
      if (offset < 0 || offset > current.current.height) {
        touch.current.allowed = false;
        return;
      }
      if (offset <= current.current.dragAreaHeight) {
        touch.current.allowed = true;
        return;
      }
      const checks = [...cancellations.current.values()].map((canStart) => canStart?.(x, y) ?? true);
      if (checks.every((check) => typeof check === 'boolean')) touch.current.allowed = checks.every(Boolean);
      else
        void Promise.all(checks).then(
          (checks) => {
            if (touch.current.token === token) touch.current.allowed = checks.every(Boolean);
          },
          () => {
            if (touch.current.token === token) touch.current.allowed = false;
          }
        );
    });
    return false;
  };
  const moveDrag = (event: GestureResponderEvent) => {
    const state = touch.current.start;
    if (!state) return;
    if (event.nativeEvent.touches.length !== 1 || !current.current.swipeable || !current.current.dismissible || !current.current.ready) {
      cancelDrag();
      return;
    }
    const point = event.nativeEvent.touches.find((point) => point.identifier === state.identifier);
    if (!point) return;
    const distance = Math.max(0, point.pageY - state.y);
    if (!state.active) {
      const dx = Math.abs(point.pageX - state.x);
      if (Math.max(Math.abs(point.pageY - state.y), dx) <= 6) return;
      if (distance <= dx || touch.current.allowed === false) {
        cancelDrag();
        return;
      }
      if (touch.current.allowed === undefined) return;
      state.active = true;
      for (const cancel of cancellations.current.keys()) cancel();
      Keyboard.dismiss();
      translation.stopAnimation();
      backdropOpacity.stopAnimation();
    }
    const elapsed = point.timestamp - state.lastTime;
    if (elapsed > 0) state.velocity = (point.pageY - state.lastY) / elapsed;
    state.lastY = point.pageY;
    state.lastTime = point.timestamp;
    state.distance = distance;
    translation.setValue(distance);
    backdropOpacity.setValue(Math.max(0, 1 - distance / current.current.height));
  };
  const endDrag = () => {
    const state = touch.current.start;
    touch.current.start = null;
    touch.current.allowed = false;
    ++touch.current.token;
    if (!state?.active) return;
    if (!current.current.swipeable || !current.current.dismissible || !current.current.ready) {
      restore();
      return;
    }
    const { height, onClose } = current.current;
    if (state.distance > Math.min(96, Math.max(48, height * 0.2)) || (state.distance > 16 && state.velocity > 0.8)) {
      if (closing.current) return;
      closing.current = true;
      const duration = reducedMotion.current ? 0 : 180;
      Animated.parallel([
        Animated.timing(translation, { toValue: height, duration, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration, useNativeDriver: true })
      ]).start(({ finished }) => {
        if (finished && alive.current) onClose();
        else closing.current = false;
      });
    } else restore();
  };

  return (
    <Modal
      transparent
      visible
      onRequestClose={onClose}
      animationType={sheet ? 'none' : 'fade'}
      statusBarTranslucent={sheet}
      navigationBarTranslucent={sheet}>
      <View style={{ flex: 1 }}>
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,7,24,0.48)', opacity: backdropOpacity }}
        />
        <KeyboardAvoidingView
          enabled={sheet && Platform.OS === 'ios'}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: sheet ? 'flex-end' : 'center', alignItems: 'center' }}>
          <Pressable
            accessible={dismissible}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            onPress={dismissible ? onClose : undefined}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <Animated.View
            ref={panel}
            testID={sheet ? 'nayan-sheet' : 'nayan-dialog'}
            onStartShouldSetResponderCapture={sheet && swipeable ? startDrag : undefined}
            onTouchMove={sheet && swipeable ? moveDrag : undefined}
            onTouchEnd={sheet && swipeable ? endDrag : undefined}
            onTouchCancel={sheet && swipeable ? cancelDrag : undefined}
            accessibilityViewIsModal
            pointerEvents={ready ? 'auto' : 'none'}
            style={{
              height,
              width,
              maxHeight: '100%',
              overflow: 'hidden',
              backgroundColor: background,
              borderTopLeftRadius: sheet ? 28 : 22,
              borderTopRightRadius: sheet ? 28 : 22,
              borderBottomLeftRadius: sheet ? 0 : 22,
              borderBottomRightRadius: sheet ? 0 : 22,
              borderWidth: 1,
              borderBottomWidth: sheet ? 0 : 1,
              borderColor: border,
              opacity: ready ? 1 : 0,
              transform: sheet ? [{ translateY: translation }] : undefined,
              paddingBottom: sheet ? bottomInset : 0
            }}>
            {backdrop ?? (
              <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: background }} />
            )}
            {sheet && (
              <View
                accessible={false}
                onTouchStart={
                  swipeable
                    ? () => {
                        ++touch.current.token;
                        touch.current.allowed = current.current.ready && !closing.current;
                      }
                    : undefined
                }
                style={{ height: swipeable ? 32 : 16, alignItems: 'center', justifyContent: 'center' }}>
                {swipeable && <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: handleColor, opacity: 0.5 }} />}
              </View>
            )}
            <PresentationGestureContext.Provider value={gestures}>
              <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
            </PresentationGestureContext.Provider>
          </Animated.View>
          <ToastHostOwnershipContext.Provider value={null}>
            <NToastHost top={48} />
          </ToastHostOwnershipContext.Provider>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
