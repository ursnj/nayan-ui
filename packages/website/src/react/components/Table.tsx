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
    <ComponentWrapper code={code} attributes={tableAttributes}>
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

export const tableAttributes = [
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'captionClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'headerClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'headerRowClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'headerCellClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'bodyClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'bodyRowClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'bodyCellClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'caption', type: 'string', default: 'Optional', details: 'Caption for the table.' },
  { name: 'columns', type: 'NTableColumn<T>[]', default: 'Required', details: 'Array of table columns.' },
  { name: 'data', type: 'T[]', default: 'Required', details: 'Array of table data.' },
  { name: 'tableProps', type: 'React.TableHTMLAttributes<HTMLTableElement>', default: 'Optional', details: 'Props for table element.' },
  {
    name: 'rowProps',
    type: '(row: T, rowIndex: number) => React.HTMLAttributes<HTMLTableRowElement>',
    default: 'Optional',
    details: 'Function to get row props.'
  },
  {
    name: 'cellProps',
    type: '(row: T, col: NTableColumn<T>, rowIndex: number, colIndex: number) => React.TdHTMLAttributes<HTMLTableCellElement>',
    default: 'Optional',
    details: 'Function to get cell props.'
  },
  { name: 'variant', type: "'primary' | 'secondary'", default: "'primary'", details: 'Visual variant of the table.' },
  { name: 'emptyMessage', type: 'React.ReactNode', default: 'Optional', details: 'Content shown when table has no data.' },
  { name: 'getRowKey', type: '(row: T, index: number) => string | number', default: 'Optional', details: 'Custom key extractor for table rows.' }
];
