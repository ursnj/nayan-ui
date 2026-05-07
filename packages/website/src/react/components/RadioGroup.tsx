import { useState } from 'react';
import { NRadioGroup } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const items = [
  { label: 'Startup', value: 'startup' },
  { label: 'Business', value: 'business' },
  { label: 'Enterprise', value: 'enterprise' }
];

const RadioGroup = () => {
  const [value, setValue] = useState('startup');

  return (
    <ComponentWrapper>
      <NRadioGroup label="Plan" items={items} value={value} onChange={setValue} />
    </ComponentWrapper>
  );
};

export default RadioGroup;
