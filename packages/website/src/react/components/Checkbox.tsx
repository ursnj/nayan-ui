import { useState } from 'react';
import { NCheck, NLink } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Checkbox = () => {
  const [checked, setChecked] = useState(true);

  return (
    <ComponentWrapper>
      <NCheck checked={checked} disabled={false} onChange={setChecked}>
        Sample label for checkbox. accept <NLink>terms</NLink>
      </NCheck>
    </ComponentWrapper>
  );
};

export default Checkbox;
