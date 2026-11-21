'use client';

import { useId, useState } from 'react';
import { NRadio, NRadioGroup, NText, NView } from 'nayan-ui/components';

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
    <NView tag="label" className="component-radio-option">
      <NRadio tag="input" type="radio" name={group} checked={checked ?? false} disabled={disabled} onChange={onSelect} />
      <NText>{label}</NText>
    </NView>
  );
}

export function RadioOption() {
  const group = useId();
  const [checked, setChecked] = useState(false);
  return (
    <NView className="component-host-demo">
      <Option group={group} label="Beginner" checked={checked} onSelect={() => setChecked(true)} />
    </NView>
  );
}

export function RadioOptions() {
  const group = useId();
  const [selected, setSelected] = useState('beginner');
  return (
    <NRadioGroup tag="fieldset" className="component-radio-group">
      <NText tag="legend" className="component-disclosure-label">
        Experience
      </NText>
      <NView className="component-disclosure-list">
        <Option group={group} label="Beginner" checked={selected === 'beginner'} onSelect={() => setSelected('beginner')} />
        <Option group={group} label="Advanced" checked={selected === 'advanced'} onSelect={() => setSelected('advanced')} />
        <Option group={group} label="Expert (disabled)" disabled />
      </NView>
    </NRadioGroup>
  );
}
