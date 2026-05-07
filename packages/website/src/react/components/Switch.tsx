import { useState } from 'react';
import { NSwitch } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Switch = () => {
  const [enabled, setEnabled] = useState(false);

  return (
    <ComponentWrapper>
      <NSwitch label="Airplane Mode" enabled={enabled} onChange={setEnabled} />
    </ComponentWrapper>
  );
};

export default Switch;
