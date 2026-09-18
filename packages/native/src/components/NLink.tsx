import React from 'react';
import { Linking } from 'react-native';
import { LinkButton, type LinkButtonProps, cn } from 'heroui-native';

export interface NLinkProps extends Omit<LinkButtonProps, 'children'> {
  children: React.ReactNode;
  href?: string;
  labelClassName?: string;
}

export const NLink = React.memo<NLinkProps>(({ children, href, onPress, className, labelClassName, ...props }) => {
  const handlePress = (event: any) => {
    onPress?.(event);
    if (href) Linking.openURL(href);
  };

  return (
    <LinkButton className={cn(className)} onPress={handlePress} {...props}>
      <LinkButton.Label className={cn(labelClassName)}>{children}</LinkButton.Label>
    </LinkButton>
  );
});

NLink.displayName = 'NLink';
