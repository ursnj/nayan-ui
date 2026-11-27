'use client';

import { component } from './component';
import type { ComponentControlProps } from './types';

export interface NInputOtpProps extends ComponentControlProps<string> {
  /** Zero-based slot indices after which to draw a separator. */
  separatorIndices?: readonly number[];
}

export const NInputOtp = /* @__PURE__ */ component<NInputOtpProps>('NInputOtp');
