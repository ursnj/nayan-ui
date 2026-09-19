"use client";

import { NDivider } from "@nayan-ui/react";
import { H3_DOC } from "@/design/system";
import ComponentWrapper from "@/helpers/ComponentWrapper";

const Divider = () => {
  return (
    <ComponentWrapper code={code} attributes={dividerAttributes}>
      <h3 className={H3_DOC}>Horizontal:</h3>
      <NDivider orientation="horizontal" className="my-3" />

      <h3 className={H3_DOC}>Horizontal with Text:</h3>
      <NDivider orientation="horizontal" className="h-5">
        OR
      </NDivider>

      <h3 className={H3_DOC}>Vertical:</h3>
      <NDivider orientation="vertical" className="h-5" />
    </ComponentWrapper>
  );
};

export default Divider;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NDivider } from '@nayan-ui/react';

const Divider = () => {
  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Horizontal:</h3>
      <NDivider orientation="horizontal" className="my-3" />

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Horizontal with Text:</h3>
      <NDivider orientation="horizontal" className="h-5">
        OR
      </NDivider>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Vertical:</h3>
      <NDivider orientation="vertical" className="h-5" />
    </div>
  );
};

export default Divider;`;

export const dividerAttributes = [
  {
    name: "className",
    type: "string",
    default: "' '",
    details: "You can customise by passing tailwind classes.",
  },
  {
    name: "orientation",
    type: "'horizontal' | 'vertical'",
    default: "'horizontal'",
    details: "Direction of the divider.",
  },
  {
    name: "children",
    type: "React.ReactNode",
    default: "Optional",
    details: "Content to display in the divider.",
  },
  {
    name: "childrenClassName",
    type: "string",
    default: "' '",
    details: "Custom class for the children wrapper.",
  },
  {
    name: "separatorClassName",
    type: "string",
    default: "' '",
    details: "Custom class for the separator line.",
  },
];
