import type { ReactNode } from 'react';
import { componentSource } from '@/services/engine/component-examples';
import type { NamedComponentPreview } from './types';

export function scenario(title: string, imports: string, jsx: string, render: ReactNode, state?: string, height?: number): NamedComponentPreview {
  return { title, source: componentSource(imports, jsx, state, Math.max(280, height ?? 0)), render, height };
}
