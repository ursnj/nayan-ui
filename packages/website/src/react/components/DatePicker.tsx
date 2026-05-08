import { NDatePicker } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const DatePicker = () => {
  return (
    <ComponentWrapper>
      <div className="space-y-4 max-w-sm">
        <NDatePicker aria-label="Select a date" />
      </div>
    </ComponentWrapper>
  );
};

export default DatePicker;
