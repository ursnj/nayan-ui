"use client";

import { NButton, NTooltip } from "@nayan-ui/react";
import ComponentWrapper from "@/helpers/ComponentWrapper";

const Tooltip = () => {
  return (
    <ComponentWrapper code={code} attributes={tooltipAttributes}>
      <NTooltip message="This is a tooltip!">
        <NButton>Hover me</NButton>
      </NTooltip>
    </ComponentWrapper>
  );
};

export default Tooltip;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NButton, NTooltip } from '@nayan-ui/react';

const Tooltip = () => {
  return (
    <div>
      <NTooltip message="This is a tooltip!">
        <NButton>Hover me</NButton>
      </NTooltip>
    </div>
  );
};

export default Tooltip;`;

export const tooltipAttributes = [
  {
    name: "message",
    type: "React.ReactNode",
    default: "Required",
    details: "Tooltip message or content.",
  },
  {
    name: "className",
    type: "string",
    default: "' '",
    details: "You can customise by passing tailwind classes.",
  },
  {
    name: "triggerClassName",
    type: "string",
    default: "' '",
    details: "You can customise by passing tailwind classes.",
  },
  {
    name: "children",
    type: "React.ReactNode",
    default: "Required",
    details: "Tooltip trigger content.",
  },
  {
    name: "placement",
    type: "'top' | 'bottom' | 'left' | 'right'",
    default: "Optional",
    details: "Placement of the tooltip.",
  },
  {
    name: "delayShow",
    type: "number",
    default: "Optional",
    details: "Delay in ms before showing.",
  },
  { name: "delayHide", type: "number", default: "Optional", details: "Delay in ms before hiding." },
  { name: "id", type: "string", default: "Optional", details: "ID for accessibility." },
  {
    name: "ariaLabel",
    type: "string",
    default: "Optional",
    details: "ARIA label for accessibility.",
  },
  {
    name: "triggerProps",
    type: "React.HTMLAttributes<HTMLElement>",
    default: "Optional",
    details: "Props for trigger element.",
  },
  {
    name: "contentProps",
    type: "React.HTMLAttributes<HTMLDivElement>",
    default: "Optional",
    details: "Props for content element.",
  },
];
