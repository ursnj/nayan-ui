'use client';

import { createElement } from 'react';
import { component } from './component';
import type { NLinkifyProps } from './linkifyTypes';
export type { NLinkifyProps } from './linkifyTypes';

const Host = /* @__PURE__ */ component<Omit<NLinkifyProps, 'className'> & { linkify: boolean; linkClassName?: string }>('NText');

/** Match the React library: className styles detected links, while plain text inherits its parent. */
export const NLinkify = ({ className, ...props }: NLinkifyProps) => createElement(Host, { ...props, linkify: true, linkClassName: className });
