import { useState } from 'react';
import { NSlider } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Slider = () => {
  const [value, setValue] = useState(50);

  return (
    <ComponentWrapper>
      <NSlider label="Volume" value={value} onChange={setValue} />
    </ComponentWrapper>
  );
};

export default Slider;
