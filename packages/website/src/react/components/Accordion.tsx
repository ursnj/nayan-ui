import { useState } from 'react';
import { AccordionTypes, NAccordion } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const basicItems = [
  { title: 'What is Nayan UI?', message: 'Nayan UI is a modern React component library built with TypeScript and Tailwind CSS.' },
  { title: 'How to install?', message: 'Install using npm: npm install @nayan-ui/react' },
  { title: 'Is it free?', message: 'Yes, Nayan UI is completely free and open source.' }
];

const customItems = [
  {
    id: 'custom-1',
    title: 'Custom Styled Item',
    message: 'This accordion item has custom styling applied through className props.'
  },
  {
    id: 'custom-2',
    title: 'Another Custom Item',
    message: 'Each item can have individual styling and behavior.'
  }
];

const Accordion = () => {
  return (
    <ComponentWrapper>
      {/* Basic Single Mode */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Single Mode</h2>
        <p className="text-muted-foreground mb-4">Only one accordion item can be open at a time.</p>
        <NAccordion type={AccordionTypes.SINGLE} items={basicItems} />
      </div>

      {/* Multiple Mode */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Multiple Mode</h2>
        <p className="text-muted-foreground mb-4">Multiple accordion items can be open simultaneously.</p>
        <NAccordion type={AccordionTypes.MULTIPLE} items={basicItems} />
      </div>

      {/* Custom Styling */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Styling</h2>
        <p className="text-muted-foreground mb-4">Customize appearance with className props for different parts.</p>
        <NAccordion
          type={AccordionTypes.SINGLE}
          items={customItems}
          className="max-w-2xl"
          itemClassName="border-2 border-blue-200 bg-blue-50 mb-3"
          triggerClassName="text-blue-800 font-medium hover:text-blue-900"
          contentClassName="text-blue-700 bg-blue-25"
        />
      </div>

      {/* With Custom IDs */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">With Custom IDs</h2>
        <p className="text-muted-foreground mb-4">Items with custom IDs for better control and accessibility.</p>
        <NAccordion
          type={AccordionTypes.MULTIPLE}
          items={[
            { id: 'faq-1', title: 'Getting Started', message: 'Learn the basics of using Nayan UI components.' },
            { id: 'faq-2', title: 'Advanced Usage', message: 'Explore advanced patterns and customization options.' },
            { id: 'faq-3', title: 'Best Practices', message: 'Follow these guidelines for optimal performance.' }
          ]}
        />
      </div>

      {/* Minimal Example */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Minimal Example</h2>
        <p className="text-muted-foreground mb-4">Simplest accordion with just the required props.</p>
        <NAccordion items={[{ title: 'Simple Item', message: 'This is a minimal accordion example.' }]} />
      </div>
    </ComponentWrapper>
  );
};

export default Accordion;
