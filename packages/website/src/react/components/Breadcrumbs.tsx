'use client';

import { NBreadcrumbs } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const items = [{ label: 'Home', href: '/' }, { label: 'React', href: '/react/components' }, { label: 'Breadcrumbs' }];

const Breadcrumbs = () => {
  return (
    <ComponentWrapper>
      <NBreadcrumbs items={items} />
    </ComponentWrapper>
  );
};

export default Breadcrumbs;
