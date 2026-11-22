'use client';

import { useId } from 'react';
import { NDisclosure, NText, NView } from 'nayan-ui/components';
import { ChevronDownIcon } from 'nayan-ui/icons/components/chevron-down';

const questions = [
  { title: 'What is Nayan UI?', text: 'Nayan UI provides UI components, games and tools for React and React Native.' },
  { title: 'How to install?', text: 'Install the engine with Bun.' },
  { title: 'Is it free?', text: 'Yes. Nayan UI is free and open source.' }
];
const details = { title: 'Details', text: 'Expand the section to show its content.' };
const styles = {
  layout: 'component-disclosure-layout',
  label: 'component-disclosure-label',
  list: 'component-disclosure-list',
  item: 'component-disclosure',
  trigger: 'component-disclosure-trigger',
  body: 'component-disclosure-body'
};

function Item({ title, text, group }: { title: string; text: string; group?: string }) {
  return (
    <NDisclosure name={group} className={styles.item}>
      <NText tag="summary" className={styles.trigger}>
        {title}
        <ChevronDownIcon size={16} />
      </NText>
      <NText tag="p" className={styles.body}>
        {text}
      </NText>
    </NDisclosure>
  );
}

export function AccordionRows() {
  const group = useId();

  return (
    <NView className={styles.layout}>
      <NText tag="p" className={styles.label}>
        Single
      </NText>
      <NView className={styles.list}>
        {questions.map((item) => (
          <Item key={item.title} group={group} {...item} />
        ))}
      </NView>
      <NText tag="p" className={styles.label}>
        Multiple
      </NText>
      <NView className={styles.list}>
        {questions.map((item) => (
          <Item key={item.title} {...item} />
        ))}
      </NView>
    </NView>
  );
}

export function DisclosureRow() {
  return (
    <NView className={styles.layout}>
      <NView className={styles.list}>
        <Item {...details} />
      </NView>
    </NView>
  );
}

const itemSource = `function Item({ title, text, group }: { title: string; text: string; group?: string }) {
  return (
    <NDisclosure name={group} className="${styles.item}">
      <NText tag="summary" className="${styles.trigger}">
        {title}
        <NIcon name="chevron-down" size={16} />
      </NText>
      <NText tag="p" className="${styles.body}">{text}</NText>
    </NDisclosure>
  );
}`;

export const accordionSource = `'use client';

import { useId } from 'react';
import { NDisclosure, NText, NView } from 'nayan-ui/components';
import { NIcon } from 'nayan-ui/icons/catalog';

const questions = ${JSON.stringify(questions, null, 2)};

${itemSource}

export default function Example() {
  const group = useId();
  return (
    <NView className="${styles.layout}">
      <NText tag="p" className="${styles.label}">Single</NText>
      <NView className="${styles.list}">
        {questions.map(item => <Item key={item.title} group={group} {...item} />)}
      </NView>
      <NText tag="p" className="${styles.label}">Multiple</NText>
      <NView className="${styles.list}">
        {questions.map(item => <Item key={item.title} {...item} />)}
      </NView>
    </NView>
  );
}`;

export const disclosureSource = `'use client';

import { NDisclosure, NText, NView } from 'nayan-ui/components';
import { NIcon } from 'nayan-ui/icons/catalog';

${itemSource}

export default function Example() {
  return (
    <NView className="${styles.layout}">
      <NView className="${styles.list}">
        <Item title=${JSON.stringify(details.title)} text=${JSON.stringify(details.text)} />
      </NView>
    </NView>
  );
}`;
