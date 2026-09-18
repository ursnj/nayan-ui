import React, { ReactNode, memo } from 'react';
import { Link } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'onClick'> {
  href?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  onPress?: (e: any) => void;
}

const NLinkComponent: React.FC<NLinkProps> = memo(({ href, target, rel, disabled = false, className = '', children, onPress, ...rest }) => {
  const safeRel = rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined);
  return (
    <Link
      href={href}
      target={target}
      rel={safeRel}
      isDisabled={disabled}
      onPress={onPress}
      className={cn('nyn-link !text-accent', className)}
      {...(rest as any)}>
      {children}
    </Link>
  );
});

NLinkComponent.displayName = 'NLink';

export const NLink = NLinkComponent;
