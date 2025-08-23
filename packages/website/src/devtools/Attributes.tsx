import { NTable } from '@nayan-ui/react';
import SubHeader from '../helpers/SubHeader';

interface Props {
  title?: string;
  data: any[];
}

const SEOAttributes = (props: Props) => {
  const { data, title = 'Attributes' } = props;

  const columnDef = [
    { name: 'name', title: 'Name', className: 'min-w-[100px] max-w-[200px]' },
    { name: 'attribute', title: 'Attribute', className: 'min-w-[100px] max-w-[200px]' },
    { name: 'type', title: 'Type', className: 'min-w-[100px] max-w-[200px]' },
    { name: 'default', title: 'Default', className: 'min-w-[100px] w-[200px]' },
    { name: 'details', title: 'Details', className: 'min-w-[150px] w-[300px]' }
  ];

  return (
    <SubHeader title={title}>
      <NTable columns={columnDef} data={data} />
    </SubHeader>
  );
};

export default SEOAttributes;
