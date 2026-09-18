'use client';

import { NDisclosure } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Disclosure = () => {
  return (
    <ComponentWrapper code={code}>
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
