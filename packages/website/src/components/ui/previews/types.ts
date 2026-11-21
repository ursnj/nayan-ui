import type { ReactNode } from 'react';

export interface ComponentPreview {
  source: string;
  render: ReactNode;
  height?: number | 'auto';
  host?: boolean;
  styled?: boolean;
  note?: string;
}

export interface NamedComponentPreview extends ComponentPreview {
  title: string;
}
