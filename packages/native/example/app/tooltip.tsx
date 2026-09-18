import { NButton, NText, NTooltip } from '@nayan-ui/native';
import Screen from '../src/components/Screen';

export default function TooltipScreen() {
  return (
    <Screen title="NTooltip">
      <NText className="text-lg font-bold">Basic</NText>
      <NTooltip message="This is a tooltip">
        <NButton variant="outline">Hover / Press</NButton>
      </NTooltip>

      <NText className="text-lg font-bold">On different elements</NText>
      <NTooltip message="Button tooltip">
        <NButton>Primary button</NButton>
      </NTooltip>

      <NTooltip message="Ghost tooltip">
        <NButton variant="ghost">Ghost button</NButton>
      </NTooltip>

      <NText className="text-lg font-bold">Long message</NText>
      <NTooltip message="This is a longer tooltip message that provides more context about the element it's attached to.">
        <NButton variant="outline">More info</NButton>
      </NTooltip>
    </Screen>
  );
}
