'use client';

import { NLinkify } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Linkify = () => {
  return (
    <ComponentWrapper>
      <NLinkify>Read the docs at https://www.nayanui.com or www.nayanui.com/react, and mail hello@nayanui.com with anything missing.</NLinkify>
    </ComponentWrapper>
  );
};

export default Linkify;
