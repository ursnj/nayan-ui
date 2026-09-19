'use client';

import ComponentWrapper from '@/helpers/ComponentWrapper';
import DemoComingSoon from './DemoComingSoon';

const Tabs = () => {
  return (
    <ComponentWrapper code={code}>
      <DemoComingSoon componentName="Tabs" />
    </ComponentWrapper>
  );
};

export default Tabs;

export const code = `import { View } from 'react-native';
import { NTabs, NText } from '@nayan-ui/native';

export default function TabsScreen() {
  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic (uncontrolled)</NText>
      <NTabs
        defaultValue="account"
        items={[
          { label: 'Account', value: 'account', content: <NText>Manage your account settings.</NText> },
          { label: 'Security', value: 'security', content: <NText>Password and 2FA.</NText> },
          { label: 'Billing', value: 'billing', content: <NText>Payment methods and invoices.</NText> }
        ]}
      />

      <NText className="text-lg font-bold">Secondary variant</NText>
      <NTabs
        variant="secondary"
        defaultValue="tab1"
        items={[
          { label: 'Overview', value: 'tab1', content: <NText>Overview content.</NText> },
          { label: 'Analytics', value: 'tab2', content: <NText>Analytics data.</NText> },
          { label: 'Reports', value: 'tab3', content: <NText>Reports list.</NText> }
        ]}
      />

      <NText className="text-lg font-bold">With disabled tab</NText>
      <NTabs
        defaultValue="a"
        items={[
          { label: 'Active', value: 'a', content: <NText>This tab is active.</NText> },
          { label: 'Disabled', value: 'b', content: <NText>Cannot reach.</NText>, isDisabled: true },
          { label: 'Another', value: 'c', content: <NText>Another tab.</NText> }
        ]}
      />
    </View>
  );
}`;

export const tabsAttributes = [
  { name: 'items', type: 'TabItem[]', default: 'Required', details: 'Array of tab items with label, value, and optional content.' },
  { name: 'value', type: 'string', default: 'Optional', details: 'Controlled active tab value.' },
  { name: 'defaultValue', type: 'string', default: 'Optional', details: 'Default active tab value.' },
  { name: 'onValueChange', type: '(value: string) => void', default: 'Optional', details: 'Callback when active tab changes.' },
  { name: 'variant', type: 'string', default: 'Optional', details: 'Tabs variant style.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'listClassName', type: 'string', default: "' '", details: 'You can customise tab list by passing tailwind classes.' },
  { name: 'triggerClassName', type: 'string', default: "' '", details: 'You can customise tab triggers by passing tailwind classes.' },
  { name: 'contentClassName', type: 'string', default: "' '", details: 'You can customise tab content by passing tailwind classes.' }
];
