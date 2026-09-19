"use client";

import { useState } from "react";
import { NSlider } from "@nayan-ui/react";
import ComponentWrapper from "@/helpers/ComponentWrapper";

const Slider = () => {
  const [value, setValue] = useState(50);

  return (
    <ComponentWrapper code={code} attributes={sliderAttributes}>
      <NSlider label="Volume" value={value} onChange={setValue} />
    </ComponentWrapper>
  );
};

export default Slider;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NSlider } from '@nayan-ui/react';

const Slider = () => {
  const [value, setValue] = useState(50);

  return (
    <div>
      <NSlider label="Volume" value={value} onChange={setValue} />
    </div>
  );
};

export default Slider;`;

export const sliderAttributes = [
  { name: "label", type: "React.ReactNode", default: "Optional", details: "Label for the slider." },
  {
    name: "className",
    type: "string",
    default: "' '",
    details: "You can customise by passing tailwind classes.",
  },
  {
    name: "labelClassName",
    type: "string",
    default: "' '",
    details: "You can customise by passing tailwind classes.",
  },
  {
    name: "sliderClassName",
    type: "string",
    default: "' '",
    details: "You can customise by passing tailwind classes.",
  },
  { name: "id", type: "string", default: "Optional", details: "ID for the slider." },
  { name: "value", type: "number", default: "Optional", details: "Current slider value." },
  { name: "defaultValue", type: "number", default: "Optional", details: "Default slider value." },
  { name: "min", type: "number", default: "Optional", details: "Minimum slider value." },
  { name: "max", type: "number", default: "Optional", details: "Maximum slider value." },
  { name: "step", type: "number", default: "Optional", details: "Step increment for slider." },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    details: "Whether the slider is disabled.",
  },
  {
    name: "orientation",
    type: "'horizontal' | 'vertical'",
    default: "Optional",
    details: "Orientation of the slider.",
  },
  {
    name: "onChange",
    type: "(value: number) => void",
    default: "Optional",
    details: "Callback when value changes.",
  },
  {
    name: "aria-label",
    type: "string",
    default: "Optional",
    details: "ARIA label for accessibility.",
  },
  {
    name: "aria-labelledby",
    type: "string",
    default: "Optional",
    details: "ARIA labelledby for accessibility.",
  },
  {
    name: "aria-valuetext",
    type: "string",
    default: "Optional",
    details: "ARIA value text for accessibility.",
  },
];
