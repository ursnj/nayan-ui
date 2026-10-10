import { useMemo, useRef } from "react";
import { Animated, PanResponder, StyleSheet, View, type ViewStyle } from "react-native";

/** Written by `<Joystick>` on touch; read it from your game loop. Each axis is in -1..1, y is up. */
export type JoystickState = { x: number; y: number };

/** A joystick state that lives as long as the component: `const stick = useJoystick()`. */
export function useJoystick(): JoystickState {
  return useRef<JoystickState>({ x: 0, y: 0 }).current;
}

type Props = {
  state: JoystickState;
  /** Diameter of the pad in points. */
  size?: number;
  style?: ViewStyle;
};

/**
 * A relative touch stick: wherever the finger lands inside the pad is the center.
 * Updates `state` synchronously on the JS thread, so there is no React re-render per touch.
 */
export function Joystick({ state, size = 150, style }: Props) {
  const knob = useRef(new Animated.ValueXY()).current;
  const knobSize = size * 0.4;
  const reach = (size - knobSize) / 2;

  const pan = useMemo(() => {
    const reset = () => {
      state.x = 0;
      state.y = 0;
      knob.setValue({ x: 0, y: 0 });
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        const d = Math.hypot(g.dx, g.dy);
        const k = d > reach ? reach / d : 1;
        const dx = g.dx * k;
        const dy = g.dy * k;
        state.x = dx / reach;
        state.y = -dy / reach;
        knob.setValue({ x: dx, y: dy });
      },
      onPanResponderRelease: reset,
      onPanResponderTerminate: reset,
    });
  }, [state, knob, reach]);

  return (
    <View
      {...pan.panHandlers}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2 }, style]}
    >
      <Animated.View
        style={[
          styles.knob,
          { width: knobSize, height: knobSize, borderRadius: knobSize / 2 },
          { transform: knob.getTranslateTransform() },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
  },
  knob: { backgroundColor: "rgba(255,255,255,0.55)" },
});
