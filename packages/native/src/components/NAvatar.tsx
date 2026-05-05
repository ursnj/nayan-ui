import React from 'react';
import { Avatar, type AvatarRootProps, cn } from 'heroui-native';

export interface NAvatarProps extends Omit<AvatarRootProps, 'alt'> {
  src?: string;
  alt?: string;
  fallback?: string;
  fallbackDelayMs?: number;
  imageClassName?: string;
  fallbackClassName?: string;
}

export const NAvatar = React.memo<NAvatarProps>(
  ({ src, fallback, fallbackDelayMs = 0, alt = 'Avatar', className, imageClassName, fallbackClassName, ...props }) => {
    return (
      <Avatar alt={alt} className={cn(className)} {...props}>
        {src && <Avatar.Image source={{ uri: src }} className={cn(imageClassName)} />}
        <Avatar.Fallback delayMs={fallbackDelayMs} className={cn('bg-surface', fallbackClassName)}>
          {fallback}
        </Avatar.Fallback>
      </Avatar>
    );
  }
);

NAvatar.displayName = 'NAvatar';
