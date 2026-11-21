'use client';

import { NInput } from '@nayan-ui/engine/components';
import { Search } from '@/design/Icons';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export default function CatalogSearch({ label, value, onChange }: Props) {
  return (
    <label className="catalog-search">
      <Search aria-hidden size={18} />
      <NInput type="search" accessibilityLabel={label} placeholder={label} value={value} onChangeText={onChange} />
    </label>
  );
}
