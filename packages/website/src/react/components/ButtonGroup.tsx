import { useState } from 'react';
import { NButtonGroup } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const items = ['Startup', 'Business', 'Enterprise'];

const ButtonGroup = () => {
  const [selected, setSelected] = useState(items[0]);

  return (
    <ComponentWrapper>
      <NButtonGroup items={items} selected={selected} onChange={setSelected} />
    </ComponentWrapper>
  );
};

export default ButtonGroup;
