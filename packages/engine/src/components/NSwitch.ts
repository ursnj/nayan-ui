'use client';

import { component } from './component';
import type { ComponentControlProps } from './types';

export type NSwitchProps = ComponentControlProps<boolean>;

export const NSwitch = /* @__PURE__ */ component<NSwitchProps>('NSwitch');
