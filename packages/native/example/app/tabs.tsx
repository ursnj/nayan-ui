import { NTabs, NText } from '@nayan-ui/native';
import Screen from '../src/components/Screen';

export default function TabsScreen() {
  return (
    <Screen title="NTabs">
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
    </Screen>
  );
}
