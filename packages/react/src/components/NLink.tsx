import React, { ReactNode, forwardRef } from 'react';
import { cn } from '../lib/utils';

interface AnchorProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
}

interface SpanProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

type NLinkProps = AnchorProps | SpanProps;

export const NLink = forwardRef<HTMLElement, NLinkProps>((props, ref) => {
  const { className = '', children, ...rest } = props as any;
  if ('href' in props) {
    const { href, ...anchorProps } = props as AnchorProps;
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        role="link"
        href={href}
        target={anchorProps.target || '_blank'}
        rel={anchorProps.rel || 'noopener noreferrer'}
        className={cn('nyn-link text-primary cursor-pointer', className)}
        {...anchorProps}>
        {children}
      </a>
    );
  }
  const { ...spanProps } = props as SpanProps;
  return (
    <span
      ref={ref as React.Ref<HTMLSpanElement>}
      role="link"
      tabIndex={0}
      className={cn('nyn-link text-primary cursor-pointer', className)}
      onKeyDown={e => {
        if (spanProps.onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          spanProps.onClick(e as any);
        }
      }}
      {...spanProps}>
      {children}
    </span>
  );
});

NLink.displayName = 'NLink';
