import React, { memo } from 'react';
import { Avatar } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NAvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  variant?: 'default' | 'soft';
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  loading?: 'eager' | 'lazy';
}

const NAvatarComponent: React.FC<NAvatarProps> = memo(
  ({
    src,
    alt = '',
    fallback,
    size = 'md',
    color = 'default',
    variant = 'default',
    className = '',
    imageClassName = '',
    fallbackClassName = '',
    loading = 'lazy',
    ...rest
  }) => {
    return (
      <Avatar size={size} color={color} variant={variant} className={cn('nyn-avatar', className)} {...(rest as any)}>
        {src && <Avatar.Image src={src} alt={alt} loading={loading} decoding="async" className={imageClassName} />}
        {fallback != null && <Avatar.Fallback className={fallbackClassName}>{fallback}</Avatar.Fallback>}
      </Avatar>
    );
  }
);

NAvatarComponent.displayName = 'NAvatar';

export const NAvatar = NAvatarComponent;
