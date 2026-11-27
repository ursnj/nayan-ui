/// <reference types="node" />
import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initSync, parse_markdown } from '../../native/core/build/web/engine_core.js';
import { NMarkdown as MarkdownView } from './NMarkdown.web';
import type { MarkdownDocument, NMarkdownProps } from './types';
export { parseFrontMatter, type FrontMatter } from './frontMatter';
let ready = false;

/** Parse with Rust/WASM for static pages and SSR, without starting rendering, audio or storage. */
function parseMarkdown(source: string): MarkdownDocument {
  if (!ready) {
    const wasm = resolve(dirname(fileURLToPath(import.meta.url)), '../../native/core/build/web/engine_core_bg.wasm');
    initSync({ module: readFileSync(wasm) });
    ready = true;
  }
  return JSON.parse(parse_markdown(source)) as MarkdownDocument;
}

/** React Server Components choose this binding through the same public Markdown import. */
export function NMarkdown({ source, children, ...props }: NMarkdownProps) {
  return createElement(MarkdownView, { ...props, document: props.document ?? parseMarkdown(source ?? children ?? '') });
}
