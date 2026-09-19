"use client";

import { useState } from "react";
import { getLocalTimeZone, today, NDateField } from "@nayan-ui/react";
import ComponentWrapper from "@/helpers/ComponentWrapper";

const DateField = () => {
  const [value, setValue] = useState<any>(today(getLocalTimeZone()));

  return (
    <ComponentWrapper code={code} attributes={dateFieldAttributes}>
      <div className="max-w-sm">
        <NDateField
          label="Starts"
          value={value}
          onChange={setValue}
          helperText="Type it, or step the segments with the arrow keys."
        />
      </div>
    </ComponentWrapper>
  );
};

export default DateField;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { getLocalTimeZone, today } from '@internationalized/date';
import { NDateField } from '@nayan-ui/react';

const DateField = () => {
  const [value, setValue] = useState<any>(today(getLocalTimeZone()));

  return (
    <div>
      <div className="max-w-sm">
        <NDateField label="Starts" value={value} onChange={setValue} helperText="Type it, or step the segments with the arrow keys." />
      </div>
    </div>
  );
};

export default DateField;`;

export const dateFieldAttributes = [
  { name: "value", type: "any", default: "Optional", details: "The value prop." },
  { name: "defaultValue", type: "any", default: "Optional", details: "The defaultValue prop." },
  {
    name: "onChange",
    type: "(value: any) => void",
    default: "Optional",
    details: "The onChange prop.",
  },
  { name: "label", type: "ReactNode", default: "Optional", details: "The label prop." },
  { name: "minValue", type: "any", default: "Optional", details: "The minValue prop." },
  { name: "maxValue", type: "any", default: "Optional", details: "The maxValue prop." },
  {
    name: "granularity",
    type: "'day' | 'hour' | 'minute' | 'second'",
    default: "'day'",
    details: "The granularity prop.",
  },
  { name: "disabled", type: "boolean", default: "false", details: "The disabled prop." },
  { name: "isInvalid", type: "boolean", default: "false", details: "The isInvalid prop." },
  {
    name: "variant",
    type: "'primary' | 'secondary'",
    default: "'primary'",
    details: "The variant prop.",
  },
  { name: "fullWidth", type: "boolean", default: "false", details: "The fullWidth prop." },
  { name: "error", type: "ReactNode", default: "Optional", details: "The error prop." },
  { name: "helperText", type: "ReactNode", default: "Optional", details: "The helperText prop." },
  { name: "className", type: "string", default: "''", details: "The className prop." },
  { name: "labelClassName", type: "string", default: "''", details: "The labelClassName prop." },
  { name: "aria-label", type: "string", default: "'Date'", details: "The aria-label prop." },
];
