'use client';

import { NBadge } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Badge = () => {
  return (
    <ComponentWrapper>
      <h2 className="text-foreground mb-3 text-lg font-semibold">Colors:</h2>
      <div className="flex flex-wrap gap-2 mb-5">
        <NBadge color="default">Default</NBadge>
        <NBadge color="accent">Accent</NBadge>
        <NBadge color="success">Success</NBadge>
        <NBadge color="warning">Warning</NBadge>
        <NBadge color="danger">Danger</NBadge>
      </div>

      <h2 className="text-foreground mb-3 text-lg font-semibold">Variants:</h2>
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

      <h2 className="text-foreground mb-3 text-lg font-semibold">Sizes:</h2>
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
