'use client';

import { PREVIEW_STACK } from '@/design/system';
import { useId, useState } from 'react';
import { NRadio, NRadioGroup, NText, NView } from 'nayan-ui/components';

const plans = ['Startup', 'Business', 'Enterprise'];

function Option({
  group,
  label,
  checked,
  onSelect,
  disabled = false
}: {
  group: string;
  label: string;
  checked?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
}) {
  return (
    <NView tag="label" className="component-radio-option flex min-h-6 items-center gap-2 text-sm font-medium cursor-pointer [&_input]:w-4 [&_input]:h-4 [&_input]:[flex:none] [&_input]:m-0 [&_input]:[accent-color:var(--accent)] [&:has(input:disabled)]:text-muted [&:has(input:disabled)]:[cursor:default]">
      <NRadio tag="input" type="radio" name={group} checked={checked ?? false} disabled={disabled} onChange={onSelect} />
      <NText>{label}</NText>
    </NView>
  );
}

export function RadioOption() {
  const group = useId();
  const [checked, setChecked] = useState(false);
  return (
    <NView className={PREVIEW_STACK}>
      <Option group={group} label="Beginner" checked={checked} onSelect={() => setChecked(true)} />
    </NView>
  );
}

function PlanOptions({
  orientation,
  selected,
  onSelect
}: {
  orientation: 'Horizontal' | 'Vertical';
  selected: string;
  onSelect: (value: string) => void;
}) {
  const group = useId();
  return (
    <NView className="gap-2">
      <NText>{orientation}:</NText>
      <NRadioGroup tag="fieldset" className="component-radio-group min-w-0 [&_legend]:mb-2">
        <NText tag="legend" className="text-sm font-medium">
          Plan
        </NText>
        <NView className={orientation === 'Horizontal' ? 'flex flex-row flex-wrap gap-3' : 'gap-2'}>
          {plans.map((label) => (
            <Option key={label} group={group} label={label} checked={selected === label} onSelect={() => onSelect(label)} />
          ))}
        </NView>
      </NRadioGroup>
    </NView>
  );
}

export function RadioOptions() {
  const [selected, setSelected] = useState(plans[0]!);
  return (
    <NView className={PREVIEW_STACK}>
      <PlanOptions orientation="Horizontal" selected={selected} onSelect={setSelected} />
      <PlanOptions orientation="Vertical" selected={selected} onSelect={setSelected} />
    </NView>
  );
}

const optionSource = `function Option({ group, label, checked, onSelect }: {
  group: string; label: string; checked: boolean; onSelect: () => void;
}) {
  return (
    <NView tag="label" className="component-radio-option flex min-h-6 items-center gap-2 text-sm font-medium cursor-pointer [&_input]:w-4 [&_input]:h-4 [&_input]:[flex:none] [&_input]:m-0 [&_input]:[accent-color:var(--accent)] [&:has(input:disabled)]:text-muted [&:has(input:disabled)]:[cursor:default]">
      <NRadio tag="input" type="radio" name={group} checked={checked} onChange={onSelect} />
      <NText>{label}</NText>
    </NView>
  );
}`;

export const radioSource = `import { useId, useState } from 'react';
import { NRadio, NText, NView } from 'nayan-ui/components';

${optionSource}

export default function Example() {
  const group = useId();
  const [checked, setChecked] = useState(false);
  return (
    <NView className="${PREVIEW_STACK}">
      <Option group={group} label="Beginner" checked={checked} onSelect={() => setChecked(true)} />
    </NView>
  );
}`;

export const radioGroupSource = `import { useId, useState } from 'react';
import { NRadio, NRadioGroup, NText, NView } from 'nayan-ui/components';

const plans = ${JSON.stringify(plans)};

${optionSource}

function PlanOptions({ orientation, selected, onSelect }: {
  orientation: 'Horizontal' | 'Vertical'; selected: string; onSelect: (value: string) => void;
}) {
  const group = useId();
  return (
    <NView className="gap-2">
      <NText>{orientation}:</NText>
      <NRadioGroup tag="fieldset" className="component-radio-group min-w-0 [&_legend]:mb-2">
        <NText tag="legend" className="text-sm font-medium">Plan</NText>
        <NView className={orientation === 'Horizontal' ? 'flex flex-row flex-wrap gap-3' : 'gap-2'}>
          {plans.map((label) => <Option key={label} group={group} label={label} checked={selected === label} onSelect={() => onSelect(label)} />)}
        </NView>
      </NRadioGroup>
    </NView>
  );
}

export default function Example() {
  const [selected, setSelected] = useState(plans[0]!);
  return (
    <NView className="${PREVIEW_STACK}">
      <PlanOptions orientation="Horizontal" selected={selected} onSelect={setSelected} />
      <PlanOptions orientation="Vertical" selected={selected} onSelect={setSelected} />
    </NView>
  );
}`;
