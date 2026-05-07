import { AccordionTypes, NAccordion } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const items = [
  { title: 'What is Nayan UI?', message: 'Nayan UI is a modern React component library built with TypeScript and Tailwind CSS.' },
  { title: 'How to install?', message: 'Install using npm: npm install @nayan-ui/react' },
  { title: 'Is it free?', message: 'Yes, Nayan UI is completely free and open source.' }
];

const Accordion = () => {
  return (
    <ComponentWrapper>
      <h2 className="text-foreground mb-3 text-lg font-semibold">Single:</h2>
      <NAccordion type={AccordionTypes.SINGLE} items={items} />

      <h2 className="text-foreground mb-3 mt-5 text-lg font-semibold">Multiple:</h2>
      <NAccordion type={AccordionTypes.MULTIPLE} items={items} />
    </ComponentWrapper>
  );
};

export default Accordion;
