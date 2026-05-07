import { NButton } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Button = () => {
  return (
    <ComponentWrapper>
      <div className="flex flex-wrap gap-3">
        <NButton onClick={() => console.log('clicked')}>Primary</NButton>
        <NButton isOutline>Outline</NButton>
        <NButton isLoading={true}>Loading</NButton>
        <NButton disabled>Disabled</NButton>
      </div>
    </ComponentWrapper>
  );
};

export default Button;
