import React, { ReactNode, memo } from 'react';
import { Link } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NLinkProps {
  href?: string;
  target?: string;
  rel?: string;
  isDisabled?: boolean;
  className?: string;
  children: ReactNode;
  onPress?: (e: any) => void;
}

const NLinkComponent: React.FC<NLinkProps> = memo(
  ({ href, target = '_blank', rel = 'noopener noreferrer', isDisabled = false, className = '', children, onPress }) => {
    return (
      <Link href={href} target={target} rel={rel} isDisabled={isDisabled} onPress={onPress} className={cn('nyn-link', className)}>
        {children}
      </Link>
    );
  }
);

NLinkComponent.displayName = 'NLink';

export const NLink = NLinkComponent;
