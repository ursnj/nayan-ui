import { NProgress } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Progress = () => {
  return (
    <ComponentWrapper>
      <NProgress value={30} label="Uploading..." />
    </ComponentWrapper>
  );
};

export default Progress;
