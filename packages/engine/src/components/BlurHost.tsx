import { type ComponentRef, type Ref, useLayoutEffect, useState } from 'react';
import { findNodeHandle, requireNativeComponent, View, type ViewProps, type ViewStyle } from 'react-native';
import { useNativeClassStyle } from './nativeClassStyle';
import type { NBlurProps } from './NBlur';

export type NBlurTargetRef = ComponentRef<typeof View>;
export type NBlurTargetProps = ViewProps & { ref?: Ref<NBlurTargetRef>; className?: string };

const Host = /* @__PURE__ */ requireNativeComponent<ViewProps & { blurRadius: number; tint: string; targetTag: number; enabled: boolean }>(
  'NayanEngineBlur'
);

export function BlurHost({ radius = 10, tint = 'default', blurTarget, enabled = true, className, style, ...props }: NBlurProps) {
  const classes = useNativeClassStyle('NView', className)();
  const [targetTag, setTargetTag] = useState(-1);
  // Navigation can attach the target later in the same commit, before layout effects run.
  useLayoutEffect(() => {
    const next = blurTarget?.current ? (findNodeHandle(blurTarget.current) ?? -1) : -1;
    setTargetTag((previous) => (previous === next ? previous : next));
  }, [blurTarget]);
  return (
    <Host {...(props as ViewProps)} style={[classes, style] as ViewStyle[]} blurRadius={radius} tint={tint} targetTag={targetTag} enabled={enabled} />
  );
}

export function BlurTargetHost({ className, style, ...props }: NBlurTargetProps) {
  const classes = useNativeClassStyle('NView', className)();
  return <View {...props} style={[classes, style] as ViewStyle[]} collapsable={false} />;
}
