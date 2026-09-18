'use client';

import { useState } from 'react';
import { NSearchField } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const SearchField = () => {
  const [query, setQuery] = useState('');

  return (
    <ComponentWrapper code={code}>
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
