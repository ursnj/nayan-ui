import React from 'react';
import { Avatar, type AvatarRootProps } from 'heroui-native';
import { cn } from '../lib/utils';

export interface NAvatarProps extends AvatarRootProps {
  src?: string;
  fallback?: string;
  fallbackDelayMs?: number;
  imageClassName?: string;
  fallbackClassName?: string;
}

export const NAvatar = React.memo<NAvatarProps>(
  ({ src, fallback, fallbackDelayMs = 0, className, imageClassName, fallbackClassName, ...props }) => {
    return (
      <Avatar className={cn(className)} {...props}>
        {src && <Avatar.Image source={{ uri: src }} className={cn(imageClassName)} />}
        <Avatar.Fallback delayMs={fallbackDelayMs} className={cn(fallbackClassName)}>
          {fallback}
        </Avatar.Fallback>
      </Avatar>
    );
  }
);

NAvatar.displayName = 'NAvatar';
