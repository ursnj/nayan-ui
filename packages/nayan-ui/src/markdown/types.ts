import type { ComponentNode, ComponentProps, ComponentStyle } from '../components/types';

/** Serializable Rust output for server-rendered Markdown; no client parser is required. */
export type MarkdownDocument = readonly ComponentNode[];
export type MarkdownElement =
  'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'a' | 'strong' | 'em' | 'del' | 'ul' | 'ol' | 'li' | 'blockquote' | 'pre' | 'code' | 'img' | 'hr';
export interface NMarkdownProps extends Omit<ComponentProps, 'children' | 'source'> {
  source?: string;
  children?: string;
  /** Optional pre-parsed document; the server binding prepares this automatically. */
  document?: MarkdownDocument;
  /** Space between blocks, in logical pixels. */
  blockSpacing?: number;
  styles?: Partial<Record<MarkdownElement, ComponentStyle>>;
  classNames?: Partial<Record<MarkdownElement, string>>;
}
