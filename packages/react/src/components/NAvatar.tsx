import React, { memo } from 'react';
import { Avatar } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NAvatarProps {
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  variant?: 'default' | 'soft';
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}

const NAvatarComponent: React.FC<NAvatarProps> = memo(
  ({ src, alt = '', fallback, size = 'md', color = 'default', variant = 'default', className = '', imageClassName = '', fallbackClassName = '' }) => {
    return (
      <Avatar size={size} color={color} variant={variant} className={cn('nyn-avatar', className)}>
        {src && <Avatar.Image src={src} alt={alt} className={imageClassName} />}
        {fallback && <Avatar.Fallback className={fallbackClassName}>{fallback}</Avatar.Fallback>}
      </Avatar>
    );
  }
);

NAvatarComponent.displayName = 'NAvatar';

export const NAvatar = NAvatarComponent;
