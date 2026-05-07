import { useState } from 'react';
import { NCheck, NLink } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Checkbox = () => {
  const [notifications, setNotifications] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [terms, setTerms] = useState(false);
  const [disabled, setDisabled] = useState(true);

  return (
    <ComponentWrapper>
      <h2 className="text-foreground mb-3 text-lg font-semibold">Basic:</h2>
      <div className="space-y-3 mb-5">
        <NCheck checked={notifications} onChange={setNotifications}>
          Enable email notifications
        </NCheck>
        <NCheck checked={marketing} onChange={setMarketing}>
          Receive marketing updates
        </NCheck>
        <NCheck checked={terms} onChange={setTerms}>
          I agree to the <NLink href="#">Terms of Service</NLink> and <NLink href="#">Privacy Policy</NLink>
        </NCheck>
      </div>

      <h2 className="text-foreground mb-3 text-lg font-semibold">Disabled:</h2>
      <div className="space-y-3">
        <NCheck checked={disabled} disabled onChange={setDisabled}>
          This option is disabled (checked)
        </NCheck>
        <NCheck checked={false} disabled onChange={() => {}}>
          This option is disabled (unchecked)
        </NCheck>
      </div>
    </ComponentWrapper>
  );
};

export default Checkbox;
