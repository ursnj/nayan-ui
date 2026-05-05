import React from 'react';
import { LinkButton, type LinkButtonProps, cn } from 'heroui-native';

export interface NLinkButtonProps extends LinkButtonProps {
  children: React.ReactNode;
}

export const NLinkButton = React.memo<NLinkButtonProps>(({ children, className, ...props }) => {
  return (
    <LinkButton className={cn(className)} {...props}>
      <LinkButton.Label>{children}</LinkButton.Label>
    </LinkButton>
  );
});

NLinkButton.displayName = 'NLinkButton';
