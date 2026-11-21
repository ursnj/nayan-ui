'use client';

import { useId } from 'react';
import { NDisclosure, NText, NView } from '@nayan-ui/engine/components';
import { ChevronDownIcon } from '@nayan-ui/engine/icons/components/chevron-down';

const questions = [
  { title: 'What is Nayan UI?', text: 'Nayan Engine provides UI components, games and tools for React and React Native.' },
  { title: 'How to install?', text: 'Install the engine with Bun.' },
  { title: 'Is it free?', text: 'Yes. Nayan Engine is free and open source.' }
];

function Item({ title, text, group }: { title: string; text: string; group?: string }) {
  return (
    <NDisclosure name={group} className="component-disclosure">
      <NText tag="summary" className="component-disclosure-trigger">
        {title}
        <ChevronDownIcon size={16} />
      </NText>
      <NText tag="p" className="component-disclosure-body">
        {text}
      </NText>
    </NDisclosure>
  );
}

export function AccordionRows() {
  const group = useId();

  return (
    <NView className="component-disclosure-layout">
      <NText tag="p" className="component-disclosure-label">
        Single
      </NText>
      <NView className="component-disclosure-list">
        {questions.map((item) => (
          <Item key={item.title} group={group} {...item} />
        ))}
      </NView>
      <NText tag="p" className="component-disclosure-label">
        Multiple
      </NText>
      <NView className="component-disclosure-list">
        {questions.map((item) => (
          <Item key={item.title} {...item} />
        ))}
      </NView>
    </NView>
  );
}

export function DisclosureRow() {
  return (
    <NView className="component-disclosure-layout">
      <NView className="component-disclosure-list">
        <Item title="Details" text="Expand the section to show its content." />
      </NView>
    </NView>
  );
}
