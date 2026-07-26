import React, { ReactNode, memo } from 'react';
import { Link } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NLinkProps {
  href?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  onPress?: (e: any) => void;
}

const NLinkComponent: React.FC<NLinkProps> = memo(
  ({ href, target = '_blank', rel = 'noopener noreferrer', disabled = false, className = '', children, onPress }) => {
    return (
      <Link href={href} target={target} rel={rel} isDisabled={disabled} onPress={onPress} className={cn('nyn-link', className)}>
        {children}
      </Link>
    );
  }
);

NLinkComponent.displayName = 'NLink';

export const NLink = NLinkComponent;
