'use client';

import { component } from './component';
import type { ComponentControlProps } from './types';

export type NTextareaProps = ComponentControlProps<string>;

export const NTextarea = /* @__PURE__ */ component<NTextareaProps>('NTextarea');
