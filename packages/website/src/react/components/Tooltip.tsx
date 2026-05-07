import { NButton, NTooltip } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Tooltip = () => {
  return (
    <ComponentWrapper>
      <NTooltip message="This is a tooltip!">
        <NButton>Hover me</NButton>
      </NTooltip>
    </ComponentWrapper>
  );
};

export default Tooltip;
