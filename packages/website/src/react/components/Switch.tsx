'use client';

import { useState } from 'react';
import { NSwitch } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Switch = () => {
  const [airplane, setAirplane] = useState(false);
  const [wifi, setWifi] = useState(true);

  return (
    <ComponentWrapper code={code}>
      <div>
        <div className="max-w-sm space-y-3">
          <NSwitch label="Airplane Mode" enabled={airplane} onChange={setAirplane} />
          <NSwitch label="Wi-Fi" enabled={wifi} onChange={setWifi} />
          <NSwitch label="Bluetooth (disabled)" enabled={false} disabled onChange={() => {}} />
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default Switch;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NSwitch } from '@nayan-ui/react';

const Switch = () => {
  const [airplane, setAirplane] = useState(false);
  const [wifi, setWifi] = useState(true);

  return (
    <div>
      <div>
        <div className="max-w-sm space-y-3">
          <NSwitch label="Airplane Mode" enabled={airplane} onChange={setAirplane} />
          <NSwitch label="Wi-Fi" enabled={wifi} onChange={setWifi} />
          <NSwitch label="Bluetooth (disabled)" enabled={false} disabled onChange={() => {}} />
        </div>
      </div>
    </div>
  );
};

export default Switch;`;

export const switchAttributes = [
  { name: 'enabled', type: 'boolean', default: 'Optional', details: 'Whether the switch is enabled.' },
  { name: 'defaultChecked', type: 'boolean', default: 'Optional', details: 'Default checked state.' },
  { name: 'label', type: 'React.ReactNode', default: 'Optional', details: 'Label for the switch.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'switchClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'onChange', type: '(checked: boolean) => void', default: 'Optional', details: 'Callback when switch state changes.' },
  { name: 'id', type: 'string', default: 'Optional', details: 'ID for the switch.' }
];
