'use client';

import { useState } from 'react';
import { NSearchField } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const SearchField = () => {
  const [query, setQuery] = useState('');

  return (
    <ComponentWrapper>
      <div className="space-y-4 max-w-sm">
        <NSearchField value={query} onChange={setQuery} placeholder="Search components..." />
        <p className="text-sm text-muted">Query: {query || 'Empty'}</p>
      </div>
    </ComponentWrapper>
  );
};

export default SearchField;
