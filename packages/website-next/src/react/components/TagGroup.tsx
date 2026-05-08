'use client';

import { useState } from 'react';
import type { Selection } from 'react-aria-components';
import { NTagGroup } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const items = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'angular', label: 'Angular' },
  { id: 'svelte', label: 'Svelte' },
  { id: 'solid', label: 'SolidJS' }
];

const TagGroup = () => {
  const [selected, setSelected] = useState<Selection>(new Set(['react']));
  const [removableItems, setRemovableItems] = useState(items);

  const handleRemove = (keys: Set<string>) => {
    setRemovableItems(prev => prev.filter(item => !keys.has(item.id)));
  };

  return (
    <ComponentWrapper>
      <h2 className="text-foreground mb-3 text-lg font-semibold">Selectable:</h2>
      <div className="mb-5">
        <NTagGroup items={items} selectionMode="multiple" selectedKeys={selected} onSelectionChange={setSelected} />
      </div>

      <h2 className="text-foreground mb-3 text-lg font-semibold">Removable:</h2>
      <div className="mb-5">
        <NTagGroup items={removableItems} onRemove={handleRemove} />
      </div>
    </ComponentWrapper>
  );
};

export default TagGroup;
