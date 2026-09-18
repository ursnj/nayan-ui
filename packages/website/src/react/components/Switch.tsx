'use client';

import { useState } from 'react';
import { NSwitch } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Switch = () => {
  const [airplane, setAirplane] = useState(false);
  const [wifi, setWifi] = useState(true);

  return (
    <ComponentWrapper>
      {/*
       * Constrained width: NSwitch lays its label and toggle out with
       * `justify-between` for settings rows, so at the full width of the demo
       * panel the two would sit 800px apart.
       */}
      {/*
       * Two levels: the demo panel puts `max-w-full` on its direct children,
       * which would override a `max-w-sm` applied at that level.
       */}
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
