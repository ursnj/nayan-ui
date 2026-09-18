'use client';

import { useState } from 'react';
import { NListBox } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const items = [
  { id: 'report', label: 'Quarterly report.pdf', description: '2.4 MB · PDF' },
  { id: 'budget', label: 'Budget.xlsx', description: '812 KB · Spreadsheet' },
  { id: 'archive', label: 'Archive.zip', description: '18 MB · Archive', disabled: true }
];

const ListBox = () => {
  const [selected, setSelected] = useState<any>(new Set(['report']));

  return (
    <ComponentWrapper>
      <NListBox items={items} selectionMode="multiple" selectedKeys={selected} onSelectionChange={setSelected} aria-label="Files" />
    </ComponentWrapper>
  );
};

export default ListBox;
