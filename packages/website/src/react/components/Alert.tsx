import { AlertTypes, NAlert } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Alert = () => {
  return (
    <ComponentWrapper>
      <div className="space-y-3">
        <NAlert type={AlertTypes.DEFAULT} message="New version available!" onClose={() => console.log('Alert closed')} />
        <NAlert type={AlertTypes.INFO} message="New version available!" onClose={() => console.log('Alert closed')} />
        <NAlert type={AlertTypes.SUCCESS} message="New version available!" onClose={() => console.log('Alert closed')} />
        <NAlert type={AlertTypes.WARNING} message="New version available!" onClose={() => console.log('Alert closed')} />
        <NAlert type={AlertTypes.ERROR} title="Error!" message="New version available!" onClose={() => console.log('Alert closed')} />
      </div>
    </ComponentWrapper>
  );
};

export default Alert;
