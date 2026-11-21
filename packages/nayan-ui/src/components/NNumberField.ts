'use client';

import { component } from './component';
import type { ComponentControlProps } from './types';

export type NNumberFieldProps = ComponentControlProps<number>;

export const NNumberField = /* @__PURE__ */ component<NNumberFieldProps>('NNumberField');
