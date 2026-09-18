'use client';

import { useState } from 'react';
import { NTagGroup } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const items = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'angular', label: 'Angular' },
  { id: 'svelte', label: 'Svelte' },
  { id: 'solid', label: 'SolidJS' }
];

const TagGroup = () => {
  const [selected, setSelected] = useState<any>(new Set(['react']));
  const [removableItems, setRemovableItems] = useState(items);

  const handleRemove = (keys: Set<string>) => {
    setRemovableItems(prev => prev.filter(item => !keys.has(item.id)));
  };

  return (
    <ComponentWrapper code={code}>
      <h3 className={H3_DOC}>Selectable:</h3>
      <div className="mb-5">
        <NTagGroup items={items} selectionMode="multiple" selectedKeys={selected} onSelectionChange={setSelected} />
      </div>

      <h3 className={H3_DOC}>Removable:</h3>
      <div className="mb-5">
        <NTagGroup items={removableItems} onRemove={handleRemove} />
      </div>
    </ComponentWrapper>
  );
};

export default TagGroup;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NTagGroup } from '@nayan-ui/react';

const items = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'angular', label: 'Angular' },
  { id: 'svelte', label: 'Svelte' },
  { id: 'solid', label: 'SolidJS' }
];

const TagGroup = () => {
  const [selected, setSelected] = useState<any>(new Set(['react']));
  const [removableItems, setRemovableItems] = useState(items);

  const handleRemove = (keys: Set<string>) => {
    setRemovableItems(prev => prev.filter(item => !keys.has(item.id)));
  };

  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Selectable:</h3>
      <div className="mb-5">
        <NTagGroup items={items} selectionMode="multiple" selectedKeys={selected} onSelectionChange={setSelected} />
      </div>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Removable:</h3>
      <div className="mb-5">
        <NTagGroup items={removableItems} onRemove={handleRemove} />
      </div>
    </div>
  );
};

export default TagGroup;`;
