import { NAccordion, NText } from '@nayan-ui/native';
import Screen from '../src/components/Screen';

export default function AccordionScreen() {
  return (
    <Screen title="NAccordion">
      <NText className="text-lg font-bold">Single (default)</NText>
      <NAccordion
        items={[
          { title: 'What is React Native?', content: 'A framework for building native apps using React.' },
          { title: 'What is Expo?', content: 'A set of tools for building React Native apps faster.' },
          { title: 'What is HeroUI?', content: 'A component library for React Native.' }
        ]}
      />

      <NText className="text-lg font-bold">Multiple selection</NText>
      <NAccordion
        selectionMode="multiple"
        items={[
          { title: 'Item A', content: 'Content A' },
          { title: 'Item B', content: 'Content B' },
          { title: 'Item C', content: 'Content C' }
        ]}
      />

      <NText className="text-lg font-bold">With disabled item</NText>
      <NAccordion
        items={[
          { title: 'Enabled', content: 'You can expand this.' },
          { title: 'Disabled', content: 'Cannot expand.', isDisabled: true }
        ]}
      />

      <NText className="text-lg font-bold">Surface variant</NText>
      <NAccordion
        variant="surface"
        items={[
          { title: 'Surface A', content: 'Content in surface variant.' },
          { title: 'Surface B', content: 'Another surface item.' }
        ]}
      />
    </Screen>
  );
}
