import React from 'react';
import { Chip, type ChipProps, cn } from 'heroui-native';

export interface NChipProps extends ChipProps {}

export const NChip = React.memo<NChipProps>(({ children, className, ...props }) => {
  return (
    <Chip className={cn(className)} {...props}>
      <Chip.Label>{children}</Chip.Label>
    </Chip>
  );
});

NChip.displayName = 'NChip';
