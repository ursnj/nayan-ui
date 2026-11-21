'use client';

import { NView, NInput } from 'nayan-ui/components';
import { Search } from '@/design/Icons';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export default function CatalogSearch({ label, value, onChange }: Props) {
  return (
    <NView tag="label" className="catalog-search">
      <Search aria-hidden size={18} />
      <NInput type="search" accessibilityLabel={label} placeholder={label} value={value} onChangeText={onChange} />
    </NView>
  );
}
