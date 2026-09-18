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
