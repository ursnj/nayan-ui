'use client';

import { NBadge } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Badge = () => {
  return (
    <ComponentWrapper code={code}>
      <h3 className={H3_DOC}>Colors:</h3>
      <div className="flex flex-wrap gap-2 mb-5">
        <NBadge color="default">Default</NBadge>
        <NBadge color="accent">Accent</NBadge>
        <NBadge color="success">Success</NBadge>
        <NBadge color="warning">Warning</NBadge>
        <NBadge color="danger">Danger</NBadge>
      </div>

      <h3 className={H3_DOC}>Variants:</h3>
      <div className="flex flex-wrap gap-2 mb-5">
        <NBadge color="accent" variant="primary">
          Primary
        </NBadge>
        <NBadge color="accent" variant="secondary">
          Secondary
        </NBadge>
        <NBadge color="accent" variant="soft">
          Soft
        </NBadge>
      </div>

      <h3 className={H3_DOC}>Sizes:</h3>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <NBadge color="accent" size="sm">
          Small
        </NBadge>
        <NBadge color="accent" size="md">
          Medium
        </NBadge>
        <NBadge color="accent" size="lg">
          Large
        </NBadge>
      </div>
    </ComponentWrapper>
  );
};

export default Badge;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NBadge } from '@nayan-ui/react';

const Badge = () => {
  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Colors:</h3>
      <div className="flex flex-wrap gap-2 mb-5">
        <NBadge color="default">Default</NBadge>
        <NBadge color="accent">Accent</NBadge>
        <NBadge color="success">Success</NBadge>
        <NBadge color="warning">Warning</NBadge>
        <NBadge color="danger">Danger</NBadge>
      </div>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Variants:</h3>
      <div className="flex flex-wrap gap-2 mb-5">
        <NBadge color="accent" variant="primary">
          Primary
        </NBadge>
        <NBadge color="accent" variant="secondary">
          Secondary
        </NBadge>
        <NBadge color="accent" variant="soft">
          Soft
        </NBadge>
      </div>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Sizes:</h3>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <NBadge color="accent" size="sm">
          Small
        </NBadge>
        <NBadge color="accent" size="md">
          Medium
        </NBadge>
        <NBadge color="accent" size="lg">
          Large
        </NBadge>
      </div>
    </div>
  );
};

export default Badge;`;
