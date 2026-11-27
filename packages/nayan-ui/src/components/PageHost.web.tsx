import type { CSSProperties, PropsWithChildren } from 'react';

export function PageHost({
  children,
  fillViewport,
  style
}: PropsWithChildren<{ keyboard: boolean; fillViewport?: boolean; style?: CSSProperties }>) {
  const height = style?.height ?? (fillViewport ? '100dvh' : undefined);
  return <div style={{ display: 'flex', flexDirection: 'column', flex: height === undefined ? 1 : 'none', minHeight: 0, height, ...style }}>{children}</div>;
}
