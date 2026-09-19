'use client';

import { useState } from 'react';
import { NPagination } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Pagination = () => {
  const [page, setPage] = useState(3);

  return (
    <ComponentWrapper code={code}>
      <h3 className={H3_DOC}>Nine pages:</h3>
      <div className="mb-5">
        <NPagination totalPages={9} currentPage={page} onChange={setPage} />
      </div>

      <h3 className={H3_DOC}>With a summary:</h3>
      <NPagination totalPages={40} currentPage={page} onChange={setPage} showSummary />
    </ComponentWrapper>
  );
};

export default Pagination;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NPagination } from '@nayan-ui/react';

const Pagination = () => {
  const [page, setPage] = useState(3);

  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Nine pages:</h3>
      <div className="mb-5">
        <NPagination totalPages={9} currentPage={page} onChange={setPage} />
      </div>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">With a summary:</h3>
      <NPagination totalPages={40} currentPage={page} onChange={setPage} showSummary />
    </div>
  );
};

export default Pagination;`;

export const paginationAttributes = [
  { name: 'totalPages', type: 'number', default: 'Required', details: 'The totalPages prop.' },
  { name: 'currentPage', type: 'number', default: 'Required', details: 'The currentPage prop.' },
  { name: 'onChange', type: '(page: number) => void', default: 'Required', details: 'The onChange prop.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", details: 'The size prop.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'The disabled prop.' },
  { name: 'showSummary', type: 'boolean', default: 'false', details: 'The showSummary prop.' },
  { name: 'summaryText', type: 'string', default: 'Optional', details: 'The summaryText prop.' },
  { name: 'siblingCount', type: 'number', default: '1', details: 'The siblingCount prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'contentClassName', type: 'string', default: "''", details: 'The contentClassName prop.' },
  { name: 'linkClassName', type: 'string', default: "''", details: 'The linkClassName prop.' },
  { name: 'activeLinkClassName', type: 'string', default: "''", details: 'The activeLinkClassName prop.' },
  { name: 'aria-label', type: 'string', default: "'Pagination'", details: 'The aria-label prop.' }
];
