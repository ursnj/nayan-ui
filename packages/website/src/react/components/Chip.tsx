'use client';

import { NChip } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Chip = () => {
  return (
    <ComponentWrapper>
      <h3 className={H3_DOC}>Colors:</h3>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <NChip color="default">Default</NChip>
        <NChip color="accent">Accent</NChip>
        <NChip color="success">Success</NChip>
        <NChip color="warning">Warning</NChip>
        <NChip color="danger">Danger</NChip>
      </div>

      <h3 className={H3_DOC}>Variants:</h3>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <NChip color="accent" variant="primary">
          Primary
        </NChip>
        <NChip color="accent" variant="secondary">
          Secondary
        </NChip>
        <NChip color="accent" variant="tertiary">
          Tertiary
        </NChip>
        <NChip color="accent" variant="soft">
          Soft
        </NChip>
      </div>

      <h3 className={H3_DOC}>Sizes:</h3>
      <div className="flex flex-wrap items-center gap-2">
        <NChip color="accent" size="sm">
          Small
        </NChip>
        <NChip color="accent" size="md">
          Medium
        </NChip>
        <NChip color="accent" size="lg">
          Large
        </NChip>
      </div>
    </ComponentWrapper>
  );
};

export default Chip;
