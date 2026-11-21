import { useEffect } from 'react';
import { BackHandler, Keyboard, requireNativeComponent, StyleSheet, useWindowDimensions, View, type ViewProps, type ViewStyle } from 'react-native';
import type { DrawerHostProps } from './NDrawer';
const Host = /* @__PURE__ */ requireNativeComponent<
  ViewProps & {
    configuration: string;
    onDrawerChange(event: { nativeEvent: { open: boolean } }): void;
  }
>('NayanEngineDrawer');

export function DrawerHost({
  children,
  drawerContent,
  open,
  command,
  enabled,
  swipeEnabled,
  width,
  edgeWidth,
  right,
  onChange,
  overlayColor,
  accessibilityLabel,
  drawerStyle
}: DrawerHostProps) {
  const viewport = useWindowDimensions();
  const panelWidth = Math.min(width, viewport.width);
  useEffect(() => {
    if (!open) return;
    Keyboard.dismiss();
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onChange(false);
      return true;
    });
    return () => subscription.remove();
  }, [open, onChange]);
  return (
    <Host
      style={styles.root}
      configuration={JSON.stringify({ open, command, enabled, swipeEnabled, width: panelWidth, edgeWidth, right })}
      onDrawerChange={(event) => onChange(event.nativeEvent.open)}>
      <View collapsable={false} style={styles.root}>
        {children}
      </View>
      <View collapsable={false} accessible={false} style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} />
      <View
        collapsable={false}
        accessibilityLabel={accessibilityLabel}
        onAccessibilityEscape={() => onChange(false)}
        style={[styles.panel, { width: panelWidth, ...(right ? { right: 0 } : { left: 0 }) }, drawerStyle as ViewStyle]}>
        {drawerContent}
      </View>
    </Host>
  );
}
const styles = StyleSheet.create({ root: { flex: 1 }, panel: { position: 'absolute', top: 0, bottom: 0, maxWidth: '100%' } });
