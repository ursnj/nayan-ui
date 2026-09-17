'use client';

import { NCard } from '@nayan-ui/react';

interface DemoComingSoonProps {
  componentName?: string;
  description?: string;
}

const DemoComingSoon = ({ componentName = 'React Native component', description }: DemoComingSoonProps) => {
  return (
    <NCard className="flex items-center justify-center min-h-[300px]">
      <div className="text-center">
        <p className="mb-2 text-lg font-semibold text-muted">Demo Coming Soon</p>
        <p className="text-muted">{description || `${componentName} examples will be available soon.`}</p>
      </div>
    </NCard>
  );
};

export default DemoComingSoon;
