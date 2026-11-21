'use client';

import { component } from './component';
import type { ComponentControlProps } from './types';

export type NProgressProps = ComponentControlProps<number>;

export const NProgress = /* @__PURE__ */ component<NProgressProps>('NProgress');
