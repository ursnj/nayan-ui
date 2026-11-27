'use client';

import { component } from './component';
import type { ComponentControlProps } from './types';

export type NSliderProps = ComponentControlProps<number>;

export const NSlider = /* @__PURE__ */ component<NSliderProps>('NSlider');
