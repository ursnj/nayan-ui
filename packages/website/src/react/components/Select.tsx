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

  /*
   * `NSelect` wraps react-select, which reads an emotion cache that is null
   * during server rendering — it threw "Cannot read properties of null
   * (reading 'registered')" and took the whole page to a 500. Mounting it only
   * on the client sidesteps the server pass entirely.
   *
   * Done here rather than inside `NSelect` on purpose: skipping SSR is the
   * right call for this demo page, but it would be the wrong default to force
   * on every application that renders a select on the server.
   */
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
