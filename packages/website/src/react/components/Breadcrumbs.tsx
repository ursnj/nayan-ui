'use client';

import { NBreadcrumbs } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const items = [{ label: 'Home', href: '/' }, { label: 'React', href: '/react/components' }, { label: 'Breadcrumbs' }];

const Breadcrumbs = () => {
  return (
    <ComponentWrapper code={code}>
      <NBreadcrumbs items={items} />
    </ComponentWrapper>
  );
};

export default Breadcrumbs;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NBreadcrumbs } from '@nayan-ui/react';

const items = [{ label: 'Home', href: '/' }, { label: 'React', href: '/react/components' }, { label: 'Breadcrumbs' }];

const Breadcrumbs = () => {
  return (
    <div>
      <NBreadcrumbs items={items} />
    </div>
  );
};

export default Breadcrumbs;`;
