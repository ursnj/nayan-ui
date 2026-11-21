'use client';

import { createElement, useContext } from 'react';
import { component } from './component';
import { PatternHost } from './PatternHost';
import { ComponentRenderContext } from './ThemeContext';
import type { ComponentProps } from './types';

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

const Host = /* @__PURE__ */ component<NPatternProps>('NPattern');

/** Rust vectors in ComponentsRoot; a cached Rust-rendered image in native navigation and blur targets. */
export function NPattern(props: NPatternProps) {
  return createElement(useContext(ComponentRenderContext) ? Host : PatternHost, props);
}
