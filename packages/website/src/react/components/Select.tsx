import { useState } from 'react';
import { NSelect } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const options = [
  { value: 'startup', label: 'Startup' },
  { value: 'business', label: 'Business' },
  { value: 'enterprise', label: 'Enterprise' }
];

const Select = () => {
  const [selected, setSelected] = useState(options[0]);

  return (
    <ComponentWrapper>
      <NSelect label="Business Type" placeholder="Select plan" options={options} value={selected} onChange={setSelected} />
    </ComponentWrapper>
  );
};

export default Select;
