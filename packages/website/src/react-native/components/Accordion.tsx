'use client';

import ComponentWrapper from '@/helpers/ComponentWrapper';
import DemoComingSoon from './DemoComingSoon';

const Accordion = () => {
  return (
    <ComponentWrapper code={code}>
      <DemoComingSoon componentName="Accordion" />
    </ComponentWrapper>
  );
};

export default Accordion;

export const code = `import { View } from 'react-native';
import { NAccordion, NText } from '@nayan-ui/native';

export default function AccordionScreen() {
  return (
    <View className="p-4 gap-4">
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
    </View>
  );
}`;

export const accordionAttributes = [
  {
    name: 'items',
    type: 'AccordionItemData[]',
    default: 'Required',
    details: 'Array of accordion items with id, title, content, and optional isDisabled.'
  },
  { name: 'selectionMode', type: "'single' | 'multiple'", default: "'single'", details: 'Whether single or multiple items can be expanded.' },
  { name: 'defaultValue', type: 'string | string[]', default: 'Optional', details: 'Default expanded item values.' },
  { name: 'variant', type: "'default' | 'surface'", default: 'Optional', details: 'Visual variant style.' },
  { name: 'hideSeparator', type: 'boolean', default: 'false', details: 'Whether to hide separators between items.' },
  { name: 'isCollapsible', type: 'boolean', default: 'false', details: 'Whether expanded items can be collapsed.' },
  { name: 'isDisabled', type: 'boolean', default: 'false', details: 'Whether the accordion is disabled.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'itemClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'titleClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'contentClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' }
];
