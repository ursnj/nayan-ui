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
    <NView tag="label" className="catalog-search flex items-center [flex:1_1_13rem] [gap:0.55rem] [max-width:25rem] min-w-0 [padding:0.57rem_0.72rem] [border:1px_solid_var(--border)] [border-radius:0.72rem] [background:var(--surface)] text-accent focus-within:[border-color:var(--focus)] focus-within:[box-shadow:0_0_0_2px_color-mix(in_srgb,_var(--focus)_24%,_transparent)] [&_svg]:shrink-0 [&_input]:w-full [&_input]:min-w-0 [&_input]:[border:0] [&_input]:[outline:none] [&_input]:[background:transparent] [&_input]:text-foreground [&_input]:[font-size:0.88rem] [&_input::placeholder]:text-muted">
      <Search aria-hidden size={18} />
      <NInput type="search" accessibilityLabel={label} placeholder={label} value={value} onChangeText={onChange} />
    </NView>
  );
}
