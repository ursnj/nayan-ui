'use client';

import type { ReactElement } from 'react';
import { component } from './component';
import type { ComponentSelectProps } from './selectTypes';
import type { ComponentOption } from './types';

export type NSelectProps<Option extends ComponentOption = ComponentOption, Multi extends boolean = false> = ComponentSelectProps<
  Option,
  Multi,
  string
>;

export const NSelect = /* @__PURE__ */ component('NSelect') as <Option extends ComponentOption = ComponentOption, Multi extends boolean = false>(
  props: NSelectProps<Option, Multi>
) => ReactElement | null;
