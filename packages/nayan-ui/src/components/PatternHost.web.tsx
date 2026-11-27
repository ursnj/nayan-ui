import { createElement } from 'react';
import { component } from './component';
import type { NPatternProps } from './NPattern';

const Host = /* @__PURE__ */ component<NPatternProps>('NPattern');

// Web patterns belong to their existing ComponentsRoot; the loading fallback stays decorative.
export function PatternHost(props: NPatternProps) {
  return createElement(Host, props);
}
