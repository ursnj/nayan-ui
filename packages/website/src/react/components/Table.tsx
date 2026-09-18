'use client';

import { NTable } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const columns = [
  { name: 'name', title: 'Name' },
  { name: 'email', title: 'Email' },
  { name: 'role', title: 'Role' }
];

const data = [
  { name: 'Alice', email: 'alice@example.com', role: 'Admin' },
  { name: 'Bob', email: 'bob@example.com', role: 'User' },
  { name: 'Charlie', email: 'charlie@example.com', role: 'Editor' }
];

const Table = () => {
  return (
    <ComponentWrapper code={code}>
      <NTable columns={columns} data={data} />
    </ComponentWrapper>
  );
};

export default Table;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NTable } from '@nayan-ui/react';

const columns = [
  { name: 'name', title: 'Name' },
  { name: 'email', title: 'Email' },
  { name: 'role', title: 'Role' }
];

const data = [
  { name: 'Alice', email: 'alice@example.com', role: 'Admin' },
  { name: 'Bob', email: 'bob@example.com', role: 'User' },
  { name: 'Charlie', email: 'charlie@example.com', role: 'Editor' }
];

const Table = () => {
  return (
    <div>
      <NTable columns={columns} data={data} />
    </div>
  );
};

export default Table;`;
