'use client';

import { useState } from 'react';
import { NSwitch, NText, NView } from 'nayan-ui/components';

interface SwitchOption {
  label: string;
  enabled?: boolean;
  disabled?: boolean;
}

function SwitchRow({ label, enabled = false, disabled }: SwitchOption) {
  const [checked, setChecked] = useState(enabled);

  return (
    <NSwitch
      tag="button"
      type="button"
      role="switch"
      className="component-switch-row flex w-fit min-h-8 items-center gap-2 rounded-lg text-sm font-medium [text-align:start] focus-visible:[outline:2px_solid_var(--accent)] focus-visible:[outline-offset:3px] disabled:text-muted [&[aria-checked=true]_.component-switch-track]:[border-color:var(--accent)] [&[aria-checked=true]_.component-switch-track]:[background:var(--accent)] [&[aria-checked=true]_.component-switch-track::after]:[inset-inline-start:calc(100%_-_1rem_-_2px)] [&:disabled_.component-switch-track]:[opacity:0.55]"
      accessibilityLabel={label}
      disabled={disabled}
      {...{ 'aria-checked': checked }}
      onPress={() => setChecked(!checked)}
    >
      <NText>{label}</NText>
      <NView className="component-switch-track relative [order:-1] w-9 h-5 [flex:none] rounded-lg bg-default [transition:background-color_150ms] after:absolute after:top-1/2 after:[inset-inline-start:2px] after:w-4 after:h-4 after:rounded-full after:[background:white] after:[box-shadow:0_1px_3px_color-mix(in_srgb,_var(--foreground)_28%,_transparent)] after:[transform:translateY(-50%)] after:[transition:inset-inline-start_150ms] motion-reduce:[transition:none] motion-reduce:after:[transition:none]" aria-hidden />
    </NSwitch>
  );
}

export default function SwitchRows({ options, label }: { options: readonly SwitchOption[]; label?: string }) {
  return (
    <NView className="component-switch-list grid gap-3 m-5">
      {label && <NText className="text-sm font-medium">{label}</NText>}
      {options.map((option) => (
        <SwitchRow key={option.label} {...option} />
      ))}
    </NView>
  );
}

export function switchSource(options: readonly SwitchOption[], label?: string) {
  return `import { useState } from 'react';
import { NSwitch, NText, NView } from 'nayan-ui/components';

const options: { label: string; enabled?: boolean; disabled?: boolean }[] = ${JSON.stringify(options, null, 2)};

function SwitchRow({ label, enabled = false, disabled }: (typeof options)[number]) {
  const [checked, setChecked] = useState(enabled);
  return (
    <NSwitch tag="button" type="button" role="switch" className="component-switch-row flex w-fit min-h-8 items-center gap-2 rounded-lg text-sm font-medium [text-align:start] focus-visible:[outline:2px_solid_var(--accent)] focus-visible:[outline-offset:3px] disabled:text-muted [&[aria-checked=true]_.component-switch-track]:[border-color:var(--accent)] [&[aria-checked=true]_.component-switch-track]:[background:var(--accent)] [&[aria-checked=true]_.component-switch-track::after]:[inset-inline-start:calc(100%_-_1rem_-_2px)] [&:disabled_.component-switch-track]:[opacity:0.55]"
      accessibilityLabel={label} disabled={disabled} {...{ 'aria-checked': checked }} onPress={() => setChecked(!checked)}>
      <NText>{label}</NText>
      <NView className="component-switch-track relative [order:-1] w-9 h-5 [flex:none] rounded-lg bg-default [transition:background-color_150ms] after:absolute after:top-1/2 after:[inset-inline-start:2px] after:w-4 after:h-4 after:rounded-full after:[background:white] after:[box-shadow:0_1px_3px_color-mix(in_srgb,_var(--foreground)_28%,_transparent)] after:[transform:translateY(-50%)] after:[transition:inset-inline-start_150ms] motion-reduce:[transition:none] motion-reduce:after:[transition:none]" aria-hidden />
    </NSwitch>
  );
}

export default function Example() {
  return (
    <NView className="component-switch-list grid gap-3 m-5">${label ? `\n      <NText className="text-sm font-medium">${label}</NText>` : ''}
      {options.map((option) => <SwitchRow key={option.label} {...option} />)}
    </NView>
  );
}`;
}
