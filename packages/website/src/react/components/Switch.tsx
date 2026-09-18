'use client';

import { useState } from 'react';
import { NSwitch } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Switch = () => {
  const [airplane, setAirplane] = useState(false);
  const [wifi, setWifi] = useState(true);

  return (
    <ComponentWrapper>
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
