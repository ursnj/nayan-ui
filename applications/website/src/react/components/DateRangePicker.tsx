"use client";

import { useState } from "react";
import { getLocalTimeZone, today, NDateRangePicker } from "@nayan-ui/react";
import ComponentWrapper from "@/helpers/ComponentWrapper";

const DateRangePicker = () => {
  const [value, setValue] = useState<any>({
    start: today(getLocalTimeZone()),
    end: today(getLocalTimeZone()).add({ days: 6 }),
  });

  return (
    <ComponentWrapper code={code} attributes={dateRangePickerAttributes}>
      <div className="max-w-md">
        <NDateRangePicker label="Reporting period" value={value} onChange={setValue} />
      </div>
    </ComponentWrapper>
  );
};

export default DateRangePicker;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { getLocalTimeZone, today } from '@internationalized/date';
import { NDateRangePicker } from '@nayan-ui/react';

const DateRangePicker = () => {
  const [value, setValue] = useState<any>({ start: today(getLocalTimeZone()), end: today(getLocalTimeZone()).add({ days: 6 }) });

  return (
    <div>
      <div className="max-w-md">
        <NDateRangePicker label="Reporting period" value={value} onChange={setValue} />
      </div>
    </div>
  );
};

export default DateRangePicker;`;

export const dateRangePickerAttributes = [
  {
    name: "value",
    type: "any",
    default: "Optional",
    details: "`{ start, end }` as react-aria date values.",
  },
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
  { name: "fullWidth", type: "boolean", default: "true", details: "The fullWidth prop." },
  { name: "error", type: "ReactNode", default: "Optional", details: "The error prop." },
  { name: "helperText", type: "ReactNode", default: "Optional", details: "The helperText prop." },
  { name: "className", type: "string", default: "''", details: "The className prop." },
  { name: "labelClassName", type: "string", default: "''", details: "The labelClassName prop." },
  { name: "aria-label", type: "string", default: "'Date range'", details: "The aria-label prop." },
];
