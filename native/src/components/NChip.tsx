import React from 'react';
import { Chip, type ChipProps } from 'heroui-native';
import { cn } from '../lib/utils';

export interface NChipProps extends ChipProps {}

export const NChip = React.memo<NChipProps>(({ children, className, ...props }) => {
  return (
    <Chip className={cn(className)} {...props}>
      <Chip.Label>{children}</Chip.Label>
    </Chip>
  );
});

NChip.displayName = 'NChip';
