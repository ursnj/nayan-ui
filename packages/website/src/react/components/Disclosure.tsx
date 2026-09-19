'use client';

import { NDisclosure } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Disclosure = () => {
  return (
    <ComponentWrapper code={code} attributes={disclosureAttributes}>
      <NDisclosure title="What is included?" defaultExpanded>
        Every component in the library, the source, and the right to ship it in anything you like.
      </NDisclosure>
      <NDisclosure title="Do I need a licence key?">No. It is MIT licensed and there is nothing to activate.</NDisclosure>
    </ComponentWrapper>
  );
};

export default Disclosure;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NDisclosure } from '@nayan-ui/react';

const Disclosure = () => {
  return (
    <div>
      <NDisclosure title="What is included?" defaultExpanded>
        Every component in the library, the source, and the right to ship it in anything you like.
      </NDisclosure>
      <NDisclosure title="Do I need a licence key?">No. It is MIT licensed and there is nothing to activate.</NDisclosure>
    </div>
  );
};

export default Disclosure;`;

export const disclosureAttributes = [
  { name: 'title', type: 'ReactNode', default: 'Required', details: 'The title prop.' },
  { name: 'children', type: 'ReactNode', default: 'Required', details: 'The children prop.' },
  { name: 'defaultExpanded', type: 'boolean', default: 'false', details: 'The defaultExpanded prop.' },
  { name: 'expanded', type: 'boolean', default: 'Optional', details: 'The expanded prop.' },
  { name: 'onExpandedChange', type: '(expanded: boolean) => void', default: 'Optional', details: 'The onExpandedChange prop.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'The disabled prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'triggerClassName', type: 'string', default: "''", details: 'The triggerClassName prop.' },
  { name: 'contentClassName', type: 'string', default: "''", details: 'The contentClassName prop.' },
  { name: 'indicatorClassName', type: 'string', default: "''", details: 'The indicatorClassName prop.' }
];
