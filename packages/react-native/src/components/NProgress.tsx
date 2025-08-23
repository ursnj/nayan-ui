import React from 'react';
import { Progress } from '@/components/ui/progress';

export interface NProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

export const NProgress = React.memo<NProgressProps>(({ value, className = '', indicatorClassName = '' }) => {
  return (
    <Progress value={value} indicatorClassName={`bg-primary ${indicatorClassName}`} className={`w-full bg-card border border-border ${className}`} />
  );
});

NProgress.displayName = 'NProgress';
