'use client';

import { AlertTypes, NAlert } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Alert = () => {
  return (
    <ComponentWrapper code={code}>
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

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { AlertTypes, NAlert } from '@nayan-ui/react';

const Alert = () => {
  return (
    <div>
      <div className="space-y-3">
        <NAlert type={AlertTypes.DEFAULT} message="New version available!" onClose={() => console.log('Alert closed')} />
        <NAlert type={AlertTypes.INFO} message="New version available!" onClose={() => console.log('Alert closed')} />
        <NAlert type={AlertTypes.SUCCESS} message="New version available!" onClose={() => console.log('Alert closed')} />
        <NAlert type={AlertTypes.WARNING} message="New version available!" onClose={() => console.log('Alert closed')} />
        <NAlert type={AlertTypes.ERROR} title="Error!" message="New version available!" onClose={() => console.log('Alert closed')} />
      </div>
    </div>
  );
};

export default Alert;`;
