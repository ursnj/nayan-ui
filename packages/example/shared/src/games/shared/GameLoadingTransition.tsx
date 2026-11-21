import { memo, type ReactNode, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleSheet, View } from 'react-native';

interface GameLoadingTransitionProps {
  ready: boolean;
  loader: ReactNode;
  children: ReactNode;
}

/** Keep the loading surface over the first game frame, then release it after fading. */
export const GameLoadingTransition = memo(function GameLoadingTransition({ ready, loader, children }: GameLoadingTransitionProps) {
  const [visible, setVisible] = useState(!ready);
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!ready) {
      opacity.setValue(1);
      setVisible(true);
      return;
    }
    if (!visible) return;
    let active = true;
    let frame = 0;
    let animation: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduced) => {
        if (!active) return;
        // Give the mounted world time to draw beneath the loading surface.
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => {
            if (!active) return;
            animation = Animated.timing(opacity, { toValue: 0, duration: reduced ? 0 : 160, useNativeDriver: Platform.OS !== 'web' });
            animation.start(({ finished }) => {
              if (active && finished) setVisible(false);
            });
          });
        });
      });
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      animation?.stop();
    };
  }, [ready, visible, opacity]);
  return (
    <View style={styles.root}>
      {ready && children}
      {(visible || !ready) && (
        <Animated.View
          pointerEvents={ready ? 'none' : 'auto'}
          accessibilityElementsHidden={ready}
          importantForAccessibility={ready ? 'no-hide-descendants' : 'auto'}
          style={[StyleSheet.absoluteFill, { opacity: ready ? opacity : 1 }]}>
          {loader}
        </Animated.View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({ root: { flex: 1 } });
