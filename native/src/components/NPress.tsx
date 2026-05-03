import React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { PressableFeedback } from 'heroui-native';
import { cn } from '../helpers/utils';

export interface NPressProps extends PressableProps {
  children: React.ReactNode;
  feedback?: boolean;
  className?: string;
}

export const NPress = React.memo<NPressProps>(({ children, feedback = false, className = '', ...props }) => {
  if (feedback) {
    return (
      <PressableFeedback className={cn(className)} {...props}>
        <PressableFeedback.Highlight />
        <PressableFeedback.Ripple />
        {children}
      </PressableFeedback>
    );
  }

  return (
    <Pressable className={cn('active:opacity-80', className)} {...props}>
      {children}
    </Pressable>
  );
});

NPress.displayName = 'NPress';
