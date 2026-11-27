'use client';

import { createElement, useContext } from 'react';
import { component } from '../components/component';
import { ComponentRenderContext, PlatformRenderContext } from '../components/ThemeContext';
import type { ComponentNode, ComponentStyle, ComponentStyleProp } from '../components/types';
import type { NMarkdownProps } from './types';
const Host = /* @__PURE__ */ component<NMarkdownProps>('NMarkdown');
const View = /* @__PURE__ */ component('NView');
const Text = /* @__PURE__ */ component('NText');
const Link = /* @__PURE__ */ component('NLink');
const Image = /* @__PURE__ */ component('NImage');

function cssStyle(value: ComponentStyleProp): ComponentStyle {
  const style: ComponentStyle = Array.isArray(value)
    ? Object.assign({}, ...value.map(cssStyle))
    : value && typeof value === 'object'
      ? { ...value }
      : {};
  if (typeof style.lineHeight === 'number') style.lineHeight = `${style.lineHeight}px`;
  return style;
}
function renderNode(node: ComponentNode, props: NMarkdownProps): React.ReactNode {
  const tag = node.props.tag as keyof NonNullable<NMarkdownProps['styles']>;
  const style = cssStyle({ ...(node.props.style as object), ...props.styles?.[tag] });
  const type = node.kind === 'NLink' ? Link : node.kind === 'NImage' ? Image : node.kind === 'NView' ? View : Text;
  return createElement(
    type,
    {
      ...node.props,
      title: node.props._markdownTitle as string | undefined,
      style,
      className: [node.props.className, props.classNames?.[tag]].filter(Boolean).join(' '),
      key: node.id
    },
    node.kind === 'NImage' ? undefined : ((node.props.text as string) ?? node.children.map((child) => renderNode(child, props)))
  );
}
/** The browser fallback keeps headings/links available to search engines; active pixels stay in Rust. */
export function NMarkdown({ children, source, ...props }: NMarkdownProps) {
  const rendering = useContext(ComponentRenderContext);
  const platform = useContext(PlatformRenderContext);
  const markdown = source ?? children ?? '';
  if (rendering) return createElement(Host, { ...props, source: markdown });
  if (!platform && !props.document) throw new Error('NMarkdown requires an NTheme screen');
  const markup = createElement(
    View,
    {
      ...props,
      style: cssStyle({
        display: 'flex',
        flexDirection: 'column',
        gap: props.blockSpacing ?? 12,
        width: '100%',
        minWidth: 0,
        fontSize: 16,
        lineHeight: 26,
        ...cssStyle(props.style)
      })
    },
    props.document
      ? props.document.map((node) => renderNode(node, props))
      : createElement('pre', { style: { margin: 0, whiteSpace: 'pre-wrap' } }, markdown)
  );
  return platform ? markup : createElement(PlatformRenderContext.Provider, { value: true }, markup);
}
