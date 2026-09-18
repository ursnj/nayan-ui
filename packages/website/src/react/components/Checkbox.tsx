'use client';

import { useState } from 'react';
import { NCheck, NLink } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Checkbox = () => {
  const [notifications, setNotifications] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [terms, setTerms] = useState(false);
  const [disabled, setDisabled] = useState(true);

  return (
    <ComponentWrapper code={code}>
      <h3 className={H3_DOC}>Basic:</h3>
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

      <h3 className={H3_DOC}>Disabled:</h3>
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

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NCheck, NLink } from '@nayan-ui/react';

const Checkbox = () => {
  const [notifications, setNotifications] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [terms, setTerms] = useState(false);
  const [disabled, setDisabled] = useState(true);

  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Basic:</h3>
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

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Disabled:</h3>
      <div className="space-y-3">
        <NCheck checked={disabled} disabled onChange={setDisabled}>
          This option is disabled (checked)
        </NCheck>
        <NCheck checked={false} disabled onChange={() => {}}>
          This option is disabled (unchecked)
        </NCheck>
      </div>
    </div>
  );
};

export default Checkbox;`;
