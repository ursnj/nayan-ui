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

export const tagGroupAttributes = [
  { name: 'items', type: 'NTagItem[]', default: 'Required', details: 'List of tag items with id and label.' },
  { name: 'selectionMode', type: "'none' | 'single' | 'multiple'", default: "'none'", details: 'Selection mode.' },
  { name: 'selectedKeys', type: 'Iterable<string>', default: 'Optional', details: 'Selected tag keys.' },
  { name: 'onSelectionChange', type: '(keys: Selection) => void', default: 'Optional', details: 'Callback when selection changes.' },
  { name: 'onRemove', type: '(keys: Set<string>) => void', default: 'Optional', details: 'Callback when tags are removed.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", details: 'Tag size.' },
  { name: 'variant', type: "'default' | 'surface'", default: "'default'", details: 'Tag variant.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Disables the tag group.' },
  { name: 'className', type: 'string', default: "' '", details: 'Additional CSS classes.' }
];
