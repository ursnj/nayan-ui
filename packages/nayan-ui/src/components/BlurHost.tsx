import { useLayoutEffect, useState } from 'react';
import { findNodeHandle, Platform, requireNativeComponent, type ViewProps, type ViewStyle } from 'react-native';
import { useNativeClassStyle } from './nativeClassStyle';
import type { NBlurProps } from './NBlur';

const Host = /* @__PURE__ */ requireNativeComponent<
  ViewProps & { blurRadius: number; tint: string; material?: NBlurProps['material']; targetTag: number; enabled: boolean }
>('NayanEngineBlur');

export function BlurHost({ radius = 10, tint = 'default', material, blurTarget, enabled = true, className, style, ...props }: NBlurProps) {
  const classes = useNativeClassStyle('NView', className)();
  const [targetTag, setTargetTag] = useState(-1);
  // The same ref can point to a new native view after a navigation or remount.
  useLayoutEffect(() => {
    const next = blurTarget?.current ? (findNodeHandle(blurTarget.current) ?? -1) : -1;
    if (next !== targetTag) setTargetTag(next);
  });
  return (
    <Host
      {...(props as ViewProps)}
      style={[classes, style] as ViewStyle[]}
      blurRadius={radius}
      tint={tint}
      material={Platform.OS === 'ios' ? material : undefined}
      targetTag={targetTag}
      enabled={enabled}
    />
  );
}
