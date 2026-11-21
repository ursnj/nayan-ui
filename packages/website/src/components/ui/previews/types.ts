import type { ReactNode } from 'react';

export interface ComponentPreview {
  source: string;
  render: ReactNode;
  height?: number;
  host?: boolean;
  note?: string;
}
