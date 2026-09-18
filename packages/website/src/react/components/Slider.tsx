'use client';

import { useState } from 'react';
import { NSlider } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Slider = () => {
  const [value, setValue] = useState(50);

  return (
    <ComponentWrapper code={code}>
      <NSlider label="Volume" value={value} onChange={setValue} />
    </ComponentWrapper>
  );
};

export default Slider;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NSlider } from '@nayan-ui/react';

const Slider = () => {
  const [value, setValue] = useState(50);

  return (
    <div>
      <NSlider label="Volume" value={value} onChange={setValue} />
    </div>
  );
};

export default Slider;`;
