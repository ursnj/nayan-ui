import { NDatePicker } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const DatePicker = () => {
  return (
    <ComponentWrapper>
      <div className="w-full">
        <NDatePicker label="Date of birth" helperText="Select your date of birth" />
      </div>
    </ComponentWrapper>
  );
};

export default DatePicker;
