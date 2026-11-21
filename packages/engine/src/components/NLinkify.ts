'use client';

import { createElement } from 'react';
import { component } from './component';
import type { NLinkifyProps } from './linkifyTypes';
export type { NLinkifyProps } from './linkifyTypes';

const Host = /* @__PURE__ */ component<NLinkifyProps & { linkify: boolean }>('NText');

/** Link detection, text layout and hit testing are implemented in Rust. */
export const NLinkify = (props: NLinkifyProps) => createElement(Host, { ...props, linkify: true });
