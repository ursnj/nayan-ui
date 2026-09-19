'use client';

import { NCard } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Card = () => {
  return (
    <ComponentWrapper code={code}>
      <NCard className="p-3">This is sample card.</NCard>
    </ComponentWrapper>
  );
};

export default Card;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NCard } from '@nayan-ui/react';

const Card = () => {
  return (
    <div>
      <NCard className="p-3">This is sample card.</NCard>
    </div>
  );
};

export default Card;`;

export const cardAttributes = [
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'You can pass card content as children.' },
  {
    name: 'onClick',
    type: '(e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void',
    default: 'Optional',
    details: 'You can get callback when card is clicked.'
  }
];
