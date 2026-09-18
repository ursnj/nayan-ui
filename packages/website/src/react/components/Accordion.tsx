'use client';

import { AccordionTypes, NAccordion } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const items = [
  { title: 'What is Nayan UI?', message: 'Nayan UI is a modern React component library built with TypeScript and Tailwind CSS.' },
  { title: 'How to install?', message: 'Install using npm: npm install @nayan-ui/react' },
  { title: 'Is it free?', message: 'Yes, Nayan UI is completely free and open source.' }
];

const Accordion = () => {
  return (
    <ComponentWrapper code={code}>
      <h3 className={H3_DOC}>Single:</h3>
      <NAccordion type={AccordionTypes.SINGLE} items={items} />

      <h3 className={H3_DOC}>Multiple:</h3>
      <NAccordion type={AccordionTypes.MULTIPLE} items={items} />
    </ComponentWrapper>
  );
};

export default Accordion;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { AccordionTypes, NAccordion } from '@nayan-ui/react';

const items = [
  { title: 'What is Nayan UI?', message: 'Nayan UI is a modern React component library built with TypeScript and Tailwind CSS.' },
  { title: 'How to install?', message: 'Install using npm: npm install @nayan-ui/react' },
  { title: 'Is it free?', message: 'Yes, Nayan UI is completely free and open source.' }
];

const Accordion = () => {
  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Single:</h3>
      <NAccordion type={AccordionTypes.SINGLE} items={items} />

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Multiple:</h3>
      <NAccordion type={AccordionTypes.MULTIPLE} items={items} />
    </div>
  );
};

export default Accordion;`;
