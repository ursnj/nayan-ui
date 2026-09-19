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
    <ComponentWrapper code={code} attributes={checkboxAttributes}>
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

export const checkboxAttributes = [
  { name: 'id', type: 'string', default: 'Optional', details: 'You can pass id to create unique identifier.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'checkClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'You can pass disable state.' },
  { name: 'checked', type: 'boolean', default: 'Required', details: 'You can pass checked state.' },
  { name: 'onChange', type: '(checked: boolean) => void', default: 'Required', details: 'You can get callback when checkbox state changes.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Label content for the checkbox.' },
  { name: 'renderLabel', type: '(children: React.ReactNode) => React.ReactNode', default: 'Optional', details: 'Custom render function for label.' },
  { name: 'name', type: 'string', default: 'Optional', details: 'HTML name attribute for form submission.' },
  { name: 'value', type: 'string', default: 'Optional', details: 'Value attribute for the checkbox.' },
  { name: 'isRequired', type: 'boolean', default: 'false', details: 'Whether the checkbox is required.' },
  { name: 'isIndeterminate', type: 'boolean', default: 'false', details: 'Whether the checkbox is in an indeterminate state.' },
  { name: 'label', type: 'React.ReactNode', default: 'Optional', details: 'Alias of children for the checkbox label.' }
];
