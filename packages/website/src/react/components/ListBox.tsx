"use client";

import { useState } from "react";
import { NListBox } from "@nayan-ui/react";
import ComponentWrapper from "@/helpers/ComponentWrapper";

const items = [
  { id: "report", label: "Quarterly report.pdf", description: "2.4 MB · PDF" },
  { id: "budget", label: "Budget.xlsx", description: "812 KB · Spreadsheet" },
  { id: "archive", label: "Archive.zip", description: "18 MB · Archive", disabled: true },
];

const ListBox = () => {
  const [selected, setSelected] = useState<any>(new Set(["report"]));

  return (
    <ComponentWrapper code={code} attributes={listBoxAttributes}>
      <NListBox
        items={items}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        aria-label="Files"
      />
    </ComponentWrapper>
  );
};

export default ListBox;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NListBox } from '@nayan-ui/react';

const items = [
  { id: 'report', label: 'Quarterly report.pdf', description: '2.4 MB · PDF' },
  { id: 'budget', label: 'Budget.xlsx', description: '812 KB · Spreadsheet' },
  { id: 'archive', label: 'Archive.zip', description: '18 MB · Archive', disabled: true }
];

const ListBox = () => {
  const [selected, setSelected] = useState<any>(new Set(['report']));

  return (
    <div>
      <NListBox items={items} selectionMode="multiple" selectedKeys={selected} onSelectionChange={setSelected} aria-label="Files" />
    </div>
  );
};

export default ListBox;`;

export const listBoxAttributes = [
  { name: "items", type: "NListBoxItem[]", default: "Required", details: "The items prop." },
  {
    name: "selectionMode",
    type: "'none' | 'single' | 'multiple'",
    default: "'single'",
    details: "The selectionMode prop.",
  },
  {
    name: "selectedKeys",
    type: "Iterable<string>",
    default: "Optional",
    details: "The selectedKeys prop.",
  },
  {
    name: "onSelectionChange",
    type: "(keys: Selection) => void",
    default: "Optional",
    details: "The onSelectionChange prop.",
  },
  {
    name: "onAction",
    type: "(key: string) => void",
    default: "Optional",
    details: "Fires on click or Enter, for a list that acts rather than selects.",
  },
  {
    name: "variant",
    type: "'default' | 'danger'",
    default: "'default'",
    details: "The variant prop.",
  },
  {
    name: "disabledKeys",
    type: "Iterable<string>",
    default: "Optional",
    details: "Keys that cannot be chosen. Individual items can also carry `disabled`.",
  },
  {
    name: "emptyMessage",
    type: "ReactNode",
    default: "'Nothing here yet.'",
    details: "Shown when `items` is empty.",
  },
  { name: "className", type: "string", default: "''", details: "The className prop." },
  { name: "itemClassName", type: "string", default: "''", details: "The itemClassName prop." },
  { name: "aria-label", type: "string", default: "'Options'", details: "The aria-label prop." },
];
