import { NTable } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

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
    <ComponentWrapper>
      <NTable columns={columns} data={data} />
    </ComponentWrapper>
  );
};

export default Table;
