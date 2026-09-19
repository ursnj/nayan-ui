'use client';

import { useState } from 'react';
import { NTabs, NTabsContent } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const items = ['Account', 'Security', 'Notifications'];

const Tabs = () => {
  const [selected, setSelected] = useState(items[0]);

  return (
    <ComponentWrapper code={code}>
      <NTabs items={items} selected={selected} onChange={setSelected}>
        <NTabsContent item="Account">Account settings content.</NTabsContent>
        <NTabsContent item="Security">Security settings content.</NTabsContent>
        <NTabsContent item="Notifications">Notification preferences.</NTabsContent>
      </NTabs>
    </ComponentWrapper>
  );
};

export default Tabs;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NTabs, NTabsContent } from '@nayan-ui/react';

const items = ['Account', 'Security', 'Notifications'];

const Tabs = () => {
  const [selected, setSelected] = useState(items[0]);

  return (
    <div>
      <NTabs items={items} selected={selected} onChange={setSelected}>
        <NTabsContent item="Account">Account settings content.</NTabsContent>
        <NTabsContent item="Security">Security settings content.</NTabsContent>
        <NTabsContent item="Notifications">Notification preferences.</NTabsContent>
      </NTabs>
    </div>
  );
};

export default Tabs;`;

export const tabsAttributes = [
  { name: 'isFull', type: 'boolean', default: 'Optional', details: 'Whether tabs should take full width.' },
  { name: 'items', type: 'string[]', default: 'Required', details: 'Array of tab items.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Tab content.' },
  { name: 'selected', type: 'string', default: 'Required', details: 'Currently selected tab.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'itemClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'activeItemClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'onChange', type: '(selected: string) => void', default: 'Required', details: 'Callback when tab changes.' },
  { name: 'ariaLabel', type: 'string', default: 'Optional', details: 'ARIA label for accessibility.' },
  { name: 'id', type: 'string', default: 'Optional', details: 'ID for the tabs.' }
];
