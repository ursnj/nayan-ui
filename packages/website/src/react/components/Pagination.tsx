'use client';

import { useState } from 'react';
import { NPagination } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Pagination = () => {
  const [page, setPage] = useState(3);

  return (
    <ComponentWrapper>
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
