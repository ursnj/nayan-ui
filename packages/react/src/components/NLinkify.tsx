import React, { ReactNode, memo } from 'react';
import { Link } from '@heroui/react';
import { cn } from '../lib/utils';

/*
 * Linkification, without `react-linkify`.
 *
 * That package was the source of a recurring "Element type is invalid:
 * expected a string or a class/function but got: object" crash. It is
 * CommonJS, published once as `1.0.0-alpha` years ago, and puts its component
 * on `exports.default`; depending on the build path, a default import resolved
 * to the module namespace object rather than the component. Unwrapping
 * `.default` by hand fixed one path and not another, because the number of
 * interop wrappers differs between them — not worth guessing at for a feature
 * that is one regex and a loop.
 *
 * So the dependency is gone. This has no interop surface, renders identically
 * on the server and the client, and behaves the same under every bundler.
 */

const PATTERN = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;"'!?)\]}]|[^\s<@]+@[^\s<@]+\.[^\s<@.,:;"'!?)\]}]+)/g;

const isEmail = (value: string) => !/^(?:https?:\/\/|www\.)/i.test(value) && value.includes('@');

/** What the match should point at. `www.` needs a scheme; an address needs `mailto:`. */
const hrefFor = (match: string) => {
  if (isEmail(match)) return `mailto:${match}`;
  return /^https?:\/\//i.test(match) ? match : `https://${match}`;
};

export interface NLinkifyProps {
  children: any;
  className?: string;
}

const NLinkifyComponent = memo(({ children, className = '' }: NLinkifyProps) => {
  const linkClassName = cn('nyn-linkify', className);

  const linkifyString = (text: string, keyPrefix: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    let cursor = 0;

    /*
     * `matchAll` rather than a `while (exec())` loop: the regex is defined once
     * at module scope, so sharing its mutable `lastIndex` across renders would
     * make the output depend on what was rendered before it.
     */
    for (const match of text.matchAll(PATTERN)) {
      const value = match[0];
      const start = match.index ?? 0;

      if (start > cursor) parts.push(text.slice(cursor, start));
      parts.push(
        <Link
          key={`${keyPrefix}-${start}`}
          className={linkClassName}
          href={hrefFor(value)}
          target={isEmail(value) ? undefined : '_blank'}
          rel={isEmail(value) ? undefined : 'noopener noreferrer'}>
          {value}
        </Link>
      );
      cursor = start + value.length;
    }

    if (cursor < text.length) parts.push(text.slice(cursor));
    return parts;
  };

  /**
   * Walks whatever it is handed. Strings get linkified, arrays and element
   * children are recursed into so a link inside `<strong>` still resolves, and
   * anything else — numbers, existing elements with no children — passes
   * through untouched.
   */
  const walk = (node: ReactNode, keyPrefix: string): ReactNode => {
    if (typeof node === 'string') return linkifyString(node, keyPrefix);
    if (Array.isArray(node)) return node.map((child, index) => <React.Fragment key={index}>{walk(child, `${keyPrefix}-${index}`)}</React.Fragment>);

    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<{ children?: ReactNode }>;
      // Leave an existing anchor alone; linkifying inside one would nest them.
      if (element.type === Link || element.type === 'a') return node;
      if (element.props?.children === undefined) return node;
      return React.cloneElement(element, { children: walk(element.props.children, keyPrefix) });
    }

    return node;
  };

  return <>{walk(children, 'linkify')}</>;
});

NLinkifyComponent.displayName = 'NLinkify';

export const NLinkify = NLinkifyComponent;
