'use client';

import { useEffect, useState } from 'react';
import { NSelect } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const options = [
  { value: 'startup', label: 'Startup' },
  { value: 'business', label: 'Business' },
  { value: 'enterprise', label: 'Enterprise' }
];

const Select = () => {
  const [selected, setSelected] = useState<{ value: string; label: string } | null>(options[0]);

  // Client-only: react-select reads a null emotion cache during SSR and takes the page to a 500.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <ComponentWrapper>
      {mounted ? (
        <NSelect label="Business Type" placeholder="Select plan" options={options} value={selected} onChange={val => setSelected(val)} />
      ) : (
        <div className="h-[68px] animate-pulse rounded-lg border border-default bg-surface" aria-hidden />
      )}
    </ComponentWrapper>
  );
};

export default Select;
