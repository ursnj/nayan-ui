'use client';

import { NBreadcrumbs } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const items = [{ label: 'Home', href: '/' }, { label: 'React', href: '/react/components' }, { label: 'Breadcrumbs' }];

const Breadcrumbs = () => {
  return (
    <ComponentWrapper code={code} attributes={breadcrumbsAttributes}>
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

export const breadcrumbsAttributes = [
  { name: 'items', type: 'NBreadcrumbItem[]', default: 'Required', details: 'The items prop.' },
  { name: 'separator', type: 'React.ReactNode', default: 'Optional', details: 'The separator prop.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'The disabled prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'itemClassName', type: 'string', default: "''", details: 'The itemClassName prop.' },
  { name: 'aria-label', type: 'string', default: "'Breadcrumbs'", details: 'The aria-label prop.' }
];
