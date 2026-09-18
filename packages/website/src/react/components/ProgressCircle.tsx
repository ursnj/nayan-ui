'use client';

import { NProgressCircle } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const ProgressCircle = () => {
  return (
    <ComponentWrapper code={code}>
      <h3 className={H3_DOC}>Colors and sizes:</h3>
      <div className="mb-5 flex flex-wrap items-center gap-5">
        <NProgressCircle value={25} aria-label="Upload" />
        <NProgressCircle value={60} color="success" size="lg" aria-label="Sync" />
        <NProgressCircle value={90} color="warning" size="sm" aria-label="Disk" />
      </div>

      <h3 className={H3_DOC}>Indeterminate:</h3>
      <NProgressCircle isIndeterminate aria-label="Working" />
    </ComponentWrapper>
  );
};

export default ProgressCircle;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NProgressCircle } from '@nayan-ui/react';

const ProgressCircle = () => {
  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Colors and sizes:</h3>
      <div className="mb-5 flex flex-wrap items-center gap-5">
        <NProgressCircle value={25} aria-label="Upload" />
        <NProgressCircle value={60} color="success" size="lg" aria-label="Sync" />
        <NProgressCircle value={90} color="warning" size="sm" aria-label="Disk" />
      </div>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Indeterminate:</h3>
      <NProgressCircle isIndeterminate aria-label="Working" />
    </div>
  );
};

export default ProgressCircle;`;
