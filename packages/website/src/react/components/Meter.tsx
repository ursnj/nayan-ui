'use client';

import { NMeter } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Meter = () => {
  return (
    <ComponentWrapper>
      <h2 className="text-foreground mb-3 text-lg font-semibold">Colors:</h2>
      <div className="space-y-4 max-w-sm mb-5">
        <NMeter value={30} color="accent" label="Storage: 30%" />
        <NMeter value={60} color="success" label="Battery: 60%" />
        <NMeter value={80} color="warning" label="Memory: 80%" />
        <NMeter value={95} color="danger" label="CPU: 95%" />
      </div>

      <h2 className="text-foreground mb-3 text-lg font-semibold">Sizes:</h2>
      <div className="space-y-4 max-w-sm">
        <NMeter value={50} size="sm" label="Small" />
        <NMeter value={50} size="md" label="Medium" />
        <NMeter value={50} size="lg" label="Large" />
      </div>
    </ComponentWrapper>
  );
};

export default Meter;
