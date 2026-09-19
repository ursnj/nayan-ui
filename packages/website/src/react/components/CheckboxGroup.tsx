"use client";

import { useState } from "react";
import { NCheckGroup } from "@nayan-ui/react";
import { H3_DOC } from "@/design/system";
import ComponentWrapper from "@/helpers/ComponentWrapper";

const items = [
  { label: "Email", value: "email" },
  { label: "Push", value: "push" },
  { label: "SMS", value: "sms", disabled: true },
];

const CheckboxGroup = () => {
  const [value, setValue] = useState<string[]>(["email"]);

  return (
    <ComponentWrapper code={code} attributes={checkGroupAttributes}>
      <h3 className={H3_DOC}>Vertical:</h3>
      <div className="mb-5">
        <NCheckGroup label="Notify me by" items={items} value={value} onChange={setValue} />
      </div>

      <h3 className={H3_DOC}>Horizontal:</h3>
      <NCheckGroup
        label="Notify me by"
        items={items}
        value={value}
        onChange={setValue}
        orientation="horizontal"
      />
    </ComponentWrapper>
  );
};

export default CheckboxGroup;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NCheckGroup } from '@nayan-ui/react';

const items = [
  { label: 'Email', value: 'email' },
  { label: 'Push', value: 'push' },
  { label: 'SMS', value: 'sms', disabled: true }
];

const CheckboxGroup = () => {
  const [value, setValue] = useState<string[]>(['email']);

  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Vertical:</h3>
      <div className="mb-5">
        <NCheckGroup label="Notify me by" items={items} value={value} onChange={setValue} />
      </div>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Horizontal:</h3>
      <NCheckGroup label="Notify me by" items={items} value={value} onChange={setValue} orientation="horizontal" />
    </div>
  );
};

export default CheckboxGroup;`;

export const checkGroupAttributes = [
  { name: "items", type: "NCheckGroupItem[]", default: "Required", details: "The items prop." },
  { name: "value", type: "string[]", default: "Required", details: "The value prop." },
  {
    name: "onChange",
    type: "(selected: string[]) => void",
    default: "Required",
    details: "The onChange prop.",
  },
  {
    name: "orientation",
    type: "'horizontal' | 'vertical'",
    default: "'vertical'",
    details: "The orientation prop.",
  },
  { name: "label", type: "string", default: "Optional", details: "The label prop." },
  { name: "showLabel", type: "boolean", default: "true", details: "The showLabel prop." },
  { name: "disabled", type: "boolean", default: "false", details: "The disabled prop." },
  { name: "id", type: "string", default: "Optional", details: "The id prop." },
  { name: "className", type: "string", default: "''", details: "The className prop." },
  { name: "labelClassName", type: "string", default: "''", details: "The labelClassName prop." },
  { name: "itemClassName", type: "string", default: "''", details: "The itemClassName prop." },
];
