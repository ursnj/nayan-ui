'use client';

import { component } from './component';
import type { ComponentControlProps } from './types';

export type NInputProps = ComponentControlProps<string>;

export const NInput = /* @__PURE__ */ component<NInputProps>('NInput');
