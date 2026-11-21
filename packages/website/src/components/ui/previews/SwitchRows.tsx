'use client';

import { useState } from 'react';
import { NSwitch, NText, NView } from '@nayan-ui/engine/components';

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
      className="component-switch-row"
      accessibilityLabel={label}
      disabled={disabled}
      {...{ 'aria-checked': checked }}
      onPress={() => setChecked(!checked)}
    >
      <NText>{label}</NText>
      <NView className="component-switch-track" aria-hidden />
    </NSwitch>
  );
}

export default function SwitchRows({ options }: { options: readonly SwitchOption[] }) {
  return (
    <NView className="component-switch-list">
      {options.map((option) => (
        <SwitchRow key={option.label} {...option} />
      ))}
    </NView>
  );
}
