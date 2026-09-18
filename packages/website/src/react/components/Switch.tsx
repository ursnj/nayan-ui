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
