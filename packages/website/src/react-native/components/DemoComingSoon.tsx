import { NCard } from '@nayan-ui/react';

interface DemoComingSoonProps {
  componentName?: string;
  description?: string;
}

const DemoComingSoon = ({ componentName = 'React Native component', description }: DemoComingSoonProps) => {
  return (
    <NCard className="flex items-center justify-center min-h-[300px]">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-muted-foreground mb-2">Demo Coming Soon</h2>
        <p className="text-muted-foreground">{description || `${componentName} examples will be available soon.`}</p>
      </div>
    </NCard>
  );
};

export default DemoComingSoon;
