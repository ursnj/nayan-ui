import { NLoading } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Loading = () => {
  return (
    <ComponentWrapper>
      <div className="flex items-center gap-4">
        <NLoading size="sm" />
        <NLoading size="md" />
        <NLoading size="lg" />
      </div>
    </ComponentWrapper>
  );
};

export default Loading;
