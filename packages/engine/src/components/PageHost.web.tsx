import type { PropsWithChildren } from 'react';

export function PageHost({ children }: PropsWithChildren<{ keyboard: boolean }>) {
  return <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>{children}</div>;
}
