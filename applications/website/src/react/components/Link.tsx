"use client";

import { NLink } from "@nayan-ui/react";
import ComponentWrapper from "@/helpers/ComponentWrapper";

const Link = () => {
  return (
    <ComponentWrapper code={code} attributes={linkAttributes}>
      <NLink href="/react/components">Browse the components</NLink>
      <NLink href="https://www.nayanui.com" target="_blank">
        Open nayanui.com in a new tab
      </NLink>
    </ComponentWrapper>
  );
};

export default Link;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NLink } from '@nayan-ui/react';

const Link = () => {
  return (
    <div>
      <NLink href="/react/components">Browse the components</NLink>
      <NLink href="https://www.nayanui.com" target="_blank">
        Open nayanui.com in a new tab
      </NLink>
    </div>
  );
};

export default Link;`;

export const linkAttributes = [
  { name: "href", type: "string", default: "Optional", details: "URL for anchor links." },
  { name: "children", type: "React.ReactNode", default: "Required", details: "Link content." },
  {
    name: "className",
    type: "string",
    default: "' '",
    details: "You can customise by passing tailwind classes.",
  },
];
