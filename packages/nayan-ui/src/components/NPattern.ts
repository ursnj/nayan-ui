'use client';

import { createElement } from 'react';
import { PatternHost } from './PatternHost';
import type { ComponentProps } from './types';
import { useComponentRenderer } from './useComponentRenderer';

/** Logical points, a viewport-relative percentage, or a bounded percentage plus point offset. */
export type NPatternLength = number | `${number}%` | { percent: number; offset?: number; min?: number; maxInset?: number };

export type NPatternShape =
  | { kind: 'circle'; cx: NPatternLength; cy: NPatternLength; r: NPatternLength; color: string }
  | { kind: 'rrect'; x: NPatternLength; y: NPatternLength; w: NPatternLength; h: NPatternLength; r: NPatternLength; color: string }
  | { kind: 'diamond'; cx: NPatternLength; cy: NPatternLength; size: NPatternLength; color: string }
  | {
      kind: 'path';
      d: string;
      x?: NPatternLength;
      y?: NPatternLength;
      rotate?: number;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      strokeDasharray?: readonly number[];
      opacity?: number;
    };

export interface NPatternRecipe {
  gradients?: readonly {
    start: readonly [NPatternLength, NPatternLength];
    end: readonly [NPatternLength, NPatternLength];
    colors: readonly string[];
  }[];
  shapes?: readonly NPatternShape[];
  grid?: { spacing: number; lineWidth?: number; color: string };
}

export interface NPatternProps extends ComponentProps {
  recipe: NPatternRecipe;
  onError?: (error: Error) => void;
}

/** Rust vectors on engine surfaces and a cached native image in NPlatformView. */
export function NPattern(props: NPatternProps) {
  return useComponentRenderer('NPattern', true) ? createElement('NPattern', props) : createElement(PatternHost, props);
}
