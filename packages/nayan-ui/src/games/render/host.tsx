import { useEffect, useState } from 'react';
import { AppState, PixelRatio, StyleSheet, View, type ViewStyle } from 'react-native';
import { EngineSurface } from '../../native/surface/EngineSurface';
import { createTouchResponder } from './touch';

export type { ViewStyle };
export { createTouchResponder };
export const pixelRatio = () => PixelRatio.get();
export function useActive() {
  const [active, setActive] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);
  return active;
}
interface SurfaceProps {
  surfaceId: number;
  style?: ViewStyle;
  onSize: (width: number, height: number) => void;
  onError: (error: Error) => void;
  touch?: ReturnType<typeof createTouchResponder>;
  onPrimaryAction?: () => void;
}
export function Surface({ surfaceId, style, onSize, touch }: SurfaceProps) {
  return (
    <View
      style={[styles.canvas, style]}
      onLayout={(e) => onSize(e.nativeEvent.layout.width, e.nativeEvent.layout.height)}
      {...touch?.responder.panHandlers}>
      <EngineSurface surfaceId={surfaceId} style={styles.canvas} />
    </View>
  );
}
const styles = StyleSheet.create({ canvas: { flex: 1 } });
