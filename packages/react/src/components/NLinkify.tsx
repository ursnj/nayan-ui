import React from 'react';
// @ts-ignore
import Linkify from 'react-linkify';
import { Link } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NLinkifyProps {
  children: any;
  className?: string;
}

export const NLinkify = React.memo((props: NLinkifyProps) => {
  return (
    <Linkify
      componentDecorator={(decoratedHref: string, decoratedText: string, key: string) => (
        <Link
          className={cn('nyn-linkify text-accent hover:text-accent/80 transition-colors', props.className)}
          target="_blank"
          href={decoratedHref}
          key={key}>
          {decoratedText}
        </Link>
      )}>
      {props.children}
    </Linkify>
  );
});

NLinkify.displayName = 'NLinkify';
