"use client";

import { NLinkify } from "@nayan-ui/react";
import ComponentWrapper from "@/helpers/ComponentWrapper";

const Linkify = () => {
  return (
    <ComponentWrapper code={code} attributes={linkifyAttributes}>
      <NLinkify>
        Read the docs at https://www.nayanui.com or www.nayanui.com/react, and mail
        hello@nayanui.com with anything missing.
      </NLinkify>
    </ComponentWrapper>
  );
};

export default Linkify;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NLinkify } from '@nayan-ui/react';

const Linkify = () => {
  return (
    <div>
      <NLinkify>Read the docs at https://www.nayanui.com or www.nayanui.com/react, and mail hello@nayanui.com with anything missing.</NLinkify>
    </div>
  );
};

export default Linkify;`;

export const linkifyAttributes = [
  { name: "href", type: "string", default: "Optional", details: "URL for anchor links." },
  { name: "children", type: "React.ReactNode", default: "Required", details: "Link content." },
  {
    name: "className",
    type: "string",
    default: "' '",
    details: "You can customise by passing tailwind classes.",
  },
];
