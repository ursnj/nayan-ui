'use client';

import { createElement } from 'react';
import { component } from '../components/component';
import type { NMarkdownProps } from './types';
const Host = /* @__PURE__ */ component<NMarkdownProps>('NMarkdown');

/** Rust parses Markdown and renders its text, links, lists and images through the engine. */
export const NMarkdown = ({ children, source, ...props }: NMarkdownProps) => createElement(Host, { ...props, source: source ?? children ?? '' });
