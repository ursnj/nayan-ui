import { useState } from 'react';
import { NAutocomplete } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const items = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'angular', label: 'Angular' },
  { id: 'svelte', label: 'Svelte' },
  { id: 'solid', label: 'SolidJS' }
];

const Autocomplete = () => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <ComponentWrapper>
      <div className="space-y-4 max-w-sm">
        <NAutocomplete items={items} placeholder="Select a framework..." selectedKey={selected ?? undefined} onSelectionChange={setSelected} />
        <p className="text-sm text-muted">Selected: {selected ?? 'None'}</p>
      </div>
    </ComponentWrapper>
  );
};

export default Autocomplete;
