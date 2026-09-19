'use client';

import { useEffect, useState } from 'react';
import { NSelect } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const options = [
  { value: 'startup', label: 'Startup' },
  { value: 'business', label: 'Business' },
  { value: 'enterprise', label: 'Enterprise' }
];

const Select = () => {
  const [selected, setSelected] = useState<{ value: string; label: string } | null>(options[0]);

  // Client-only: react-select reads a null emotion cache during SSR and takes the page to a 500.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <ComponentWrapper code={code} attributes={selectAttributes}>
      {mounted ? (
        <NSelect label="Business Type" placeholder="Select plan" options={options} value={selected} onChange={val => setSelected(val)} />
      ) : (
        <div className="h-[68px] animate-pulse rounded-lg border border-default bg-surface" aria-hidden />
      )}
    </ComponentWrapper>
  );
};

export default Select;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useEffect, useState } from 'react';
import { NSelect } from '@nayan-ui/react';

const options = [
  { value: 'startup', label: 'Startup' },
  { value: 'business', label: 'Business' },
  { value: 'enterprise', label: 'Enterprise' }
];

const Select = () => {
  const [selected, setSelected] = useState<{ value: string; label: string } | null>(options[0]);

  // Client-only: react-select reads a null emotion cache during SSR and takes the page to a 500.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div>
      {mounted ? (
        <NSelect label="Business Type" placeholder="Select plan" options={options} value={selected} onChange={val => setSelected(val)} />
      ) : (
        <div className="h-[68px] animate-pulse rounded-lg border border-default bg-surface" aria-hidden />
      )}
    </div>
  );
};

export default Select;`;

export const selectAttributes = [
  { name: 'isMulti', type: 'boolean', default: 'false', details: 'You can pass isMulti option to switch between single / multi select.' },
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the select field.' },
  { name: 'placeholder', type: 'string', default: 'Optional', details: 'Placeholder text for the select.' },
  { name: 'isLoading', type: 'boolean', default: 'false', details: 'Whether the select is in loading state.' },
  { name: 'isCreatable', type: 'boolean', default: 'false', details: 'Whether new options can be created.' },
  { name: 'isClearable', type: 'boolean', default: 'false', details: 'Whether the selection can be cleared.' },
  { name: 'isSearchable', type: 'boolean', default: 'true', details: 'Whether the select is searchable.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Whether the select is disabled.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'selectClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'value', type: 'OptionType | OptionType[] | null', default: 'Required', details: 'Selected value(s).' },
  { name: 'options', type: 'OptionType[]', default: 'Required', details: 'Array of available options.' },
  { name: 'onCreateOption', type: '(inputValue: string) => void', default: 'Optional', details: 'Callback when new option is created.' },
  { name: 'onChange', type: '(value: OptionType | OptionType[] | null) => void', default: 'Optional', details: 'Callback when selection changes.' },
  {
    name: 'onChangeOptions',
    type: '(value: OptionType | OptionType[] | null) => void',
    default: 'Optional',
    details: 'Alternative change callback.'
  },
  { name: 'getOptionLabel', type: '(option: OptionType) => string', default: 'Optional', details: 'Function to get option label.' },
  { name: 'getOptionValue', type: '(option: OptionType) => string', default: 'Optional', details: 'Function to get option value.' },
  { name: 'inputId', type: 'string', default: 'Optional', details: 'ID for the input element.' },
  { name: 'name', type: 'string', default: 'Optional', details: 'Name attribute for the select.' },
  { name: 'menuPortalTarget', type: 'HTMLElement', default: 'Optional', details: 'Target element for menu portal.' }
];
