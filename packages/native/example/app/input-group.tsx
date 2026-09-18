import { NInputGroup, NText } from '@nayan-ui/native';
import Screen from '../src/components/Screen';

export default function InputGroupScreen() {
  return (
    <Screen title="NInputGroup" gap={3} keyboardAware>
      <NText className="text-lg font-bold">With prefix</NText>
      <NInputGroup label="Website" prefix={<NText className="text-muted px-3">https://</NText>} />

      <NText className="text-lg font-bold">With suffix</NText>
      <NInputGroup label="Email" suffix={<NText className="text-muted px-3">@gmail.com</NText>} />

      <NText className="text-lg font-bold">Prefix + suffix</NText>
      <NInputGroup label="Price" prefix={<NText className="text-muted px-3">$</NText>} suffix={<NText className="text-muted px-3">USD</NText>} />

      <NText className="text-lg font-bold">Disabled</NText>
      <NInputGroup label="Locked" isDisabled prefix={<NText className="text-muted px-3">#</NText>} />
    </Screen>
  );
}
