"use client";

import { NChip } from "@nayan-ui/react";
import { H3_DOC } from "@/design/system";
import ComponentWrapper from "@/helpers/ComponentWrapper";

const Chip = () => {
  return (
    <ComponentWrapper code={code} attributes={chipAttributes}>
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

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NChip } from '@nayan-ui/react';

const Chip = () => {
  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Colors:</h3>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <NChip color="default">Default</NChip>
        <NChip color="accent">Accent</NChip>
        <NChip color="success">Success</NChip>
        <NChip color="warning">Warning</NChip>
        <NChip color="danger">Danger</NChip>
      </div>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Variants:</h3>
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

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Sizes:</h3>
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
    </div>
  );
};

export default Chip;`;

export const chipAttributes = [
  { name: "children", type: "ReactNode", default: "Required", details: "The children prop." },
  { name: "size", type: "'sm' | 'md' | 'lg'", default: "'md'", details: "The size prop." },
  {
    name: "color",
    type: "'default' | 'accent' | 'success' | 'warning' | 'danger'",
    default: "'default'",
    details: "The color prop.",
  },
  {
    name: "variant",
    type: "'primary' | 'secondary' | 'tertiary' | 'soft'",
    default: "'secondary'",
    details: "The variant prop.",
  },
  { name: "className", type: "string", default: "''", details: "The className prop." },
];
