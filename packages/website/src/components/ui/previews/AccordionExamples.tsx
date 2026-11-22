'use client';

import { useState } from 'react';
import { NAccordion, NButton, NText, NView } from 'nayan-ui/components';
import { scenario } from './scenario';

const questions = [
  { title: 'What is Nayan UI?', message: 'Nayan UI provides UI components, games and tools for React and React Native.' },
  { title: 'How to install?', message: 'Install the engine with Bun.' },
  { title: 'Is it free?', message: 'Yes. Nayan UI is free and open source.' }
];

export function AccordionRows() {
  return (
    <NView className="gap-3 m-5">
      <NText className="text-sm font-semibold">Single</NText>
      <NAccordion items={questions} />
      <NText className="text-sm font-semibold">Multiple</NText>
      <NAccordion items={questions} type="multiple" />
    </NView>
  );
}

export const accordionSource = `'use client';

import { NAccordion, NText, NView } from 'nayan-ui/components';

const questions = ${JSON.stringify(questions, null, 2)};

export default function Example() {
  return (
    <NView className="gap-3 m-5">
      <NText className="text-sm font-semibold">Single</NText>
      <NAccordion items={questions} />
      <NText className="text-sm font-semibold">Multiple</NText>
      <NAccordion items={questions} type="multiple" />
    </NView>
  );
}`;

const delivery = [
  { id: 'pickup', title: 'Store pickup', message: 'Free pickup is available.' },
  { id: 'express', title: 'Express shipping', message: 'Express shipping is unavailable.', disabled: true }
];

function ControlledAccordion() {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <NButton isOutline onPress={() => setExpanded((open) => !open)}>
        {expanded ? 'Close details' : 'Open details'}
      </NButton>
      <NAccordion items={delivery} variant="surface" expanded={expanded} onExpandedChange={setExpanded} />
    </>
  );
}

export const controlledAccordion = scenario(
  'Controlled expansion',
  'NAccordion, NButton',
  `<NButton isOutline onPress={() => setExpanded((open) => !open)}>
            {expanded ? 'Close details' : 'Open details'}
          </NButton>
          <NAccordion items={delivery} variant="surface" expanded={expanded} onExpandedChange={setExpanded} />`,
  <ControlledAccordion />,
  `const [expanded, setExpanded] = useState(false);
  const delivery = ${JSON.stringify(delivery, null, 2)};`,
  224
);
