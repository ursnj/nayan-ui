'use client';

import { NMeter } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Meter = () => {
  return (
    <ComponentWrapper code={code}>
      <h3 className={H3_DOC}>Colors:</h3>
      <div className="space-y-4 max-w-sm mb-5">
        <NMeter value={30} color="accent" label="Storage" />
        <NMeter value={60} color="success" label="Battery" />
        <NMeter value={80} color="warning" label="Memory" />
        <NMeter value={95} color="danger" label="CPU" />
      </div>

      <h3 className={H3_DOC}>Sizes:</h3>
      <div className="space-y-4 max-w-sm">
        <NMeter value={50} size="sm" label="Small" />
        <NMeter value={50} size="md" label="Medium" />
        <NMeter value={50} size="lg" label="Large" />
      </div>
    </ComponentWrapper>
  );
};

export default Meter;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NMeter } from '@nayan-ui/react';

const Meter = () => {
  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Colors:</h3>
      <div className="space-y-4 max-w-sm mb-5">
        <NMeter value={30} color="accent" label="Storage" />
        <NMeter value={60} color="success" label="Battery" />
        <NMeter value={80} color="warning" label="Memory" />
        <NMeter value={95} color="danger" label="CPU" />
      </div>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Sizes:</h3>
      <div className="space-y-4 max-w-sm">
        <NMeter value={50} size="sm" label="Small" />
        <NMeter value={50} size="md" label="Medium" />
        <NMeter value={50} size="lg" label="Large" />
      </div>
    </div>
  );
};

export default Meter;`;
