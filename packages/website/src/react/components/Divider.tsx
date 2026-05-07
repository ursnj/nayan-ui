import { NDivider } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Divider = () => {
  return (
    <ComponentWrapper>
      <h2 className="text-foreground mb-3 text-lg font-semibold">Horizontal:</h2>
      <NDivider orientation="horizontal" className="my-3" />

      <h2 className="text-foreground mb-3 mt-5 text-lg font-semibold">Horizontal with Text:</h2>
      <NDivider orientation="horizontal" className="h-5">
        OR
      </NDivider>

      <h2 className="text-foreground mb-3 mt-5 text-lg font-semibold">Vertical:</h2>
      <NDivider orientation="vertical" className="h-5" />
    </ComponentWrapper>
  );
};

export default Divider;
