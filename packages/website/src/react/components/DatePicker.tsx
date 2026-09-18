'use client';

import { NDatePicker } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const DatePicker = () => {
  return (
    <ComponentWrapper code={code}>
      <div className="w-full">
        <NDatePicker label="Date of birth" helperText="Select your date of birth" />
      </div>
    </ComponentWrapper>
  );
};

export default DatePicker;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NDatePicker } from '@nayan-ui/react';

const DatePicker = () => {
  return (
    <div>
      <div className="w-full">
        <NDatePicker label="Date of birth" helperText="Select your date of birth" />
      </div>
    </div>
  );
};

export default DatePicker;`;
