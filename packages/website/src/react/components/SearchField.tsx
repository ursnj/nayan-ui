'use client';

import { useState } from 'react';
import { NSearchField } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const SearchField = () => {
  const [query, setQuery] = useState('');

  return (
    <ComponentWrapper code={code} attributes={searchFieldAttributes}>
      <div className="space-y-4 max-w-sm">
        <NSearchField value={query} onChange={setQuery} placeholder="Search components..." />
        <p className="text-sm text-muted">Query: {query || 'Empty'}</p>
      </div>
    </ComponentWrapper>
  );
};

export default SearchField;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NSearchField } from '@nayan-ui/react';

const SearchField = () => {
  const [query, setQuery] = useState('');

  return (
    <div>
      <div className="space-y-4 max-w-sm">
        <NSearchField value={query} onChange={setQuery} placeholder="Search components..." />
        <p className="text-sm text-muted">Query: {query || 'Empty'}</p>
      </div>
    </div>
  );
};

export default SearchField;`;

export const searchFieldAttributes = [
  { name: 'value', type: 'string', default: 'Optional', details: 'Controlled value.' },
  { name: 'defaultValue', type: 'string', default: 'Optional', details: 'Default value.' },
  { name: 'onChange', type: '(value: string) => void', default: 'Optional', details: 'Callback when value changes.' },
  { name: 'onSubmit', type: '(value: string) => void', default: 'Optional', details: 'Callback on submit.' },
  { name: 'onClear', type: '() => void', default: 'Optional', details: 'Callback when cleared.' },
  { name: 'placeholder', type: 'string', default: "'Search...'", details: 'Placeholder text.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Disables the search field.' },
  { name: 'isInvalid', type: 'boolean', default: 'false', details: 'Marks as invalid.' },
  { name: 'variant', type: "'primary' | 'secondary'", default: "'primary'", details: 'Visual variant.' },
  { name: 'fullWidth', type: 'boolean', default: 'false', details: 'Full width mode.' },
  { name: 'className', type: 'string', default: "' '", details: 'Additional CSS classes.' }
];
