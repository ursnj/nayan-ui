'use client';

import { NDivider } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Divider = () => {
  return (
    <ComponentWrapper>
      <h3 className={H3_DOC}>Horizontal:</h3>
      <NDivider orientation="horizontal" className="my-3" />

      <h3 className={H3_DOC}>Horizontal with Text:</h3>
      <NDivider orientation="horizontal" className="h-5">
        OR
      </NDivider>

      <h3 className={H3_DOC}>Vertical:</h3>
      <NDivider orientation="vertical" className="h-5" />
    </ComponentWrapper>
  );
};

export default Divider;
