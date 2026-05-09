'use client';

import { NLinkify } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Linkify = () => {
  return (
    <ComponentWrapper>
      <NLinkify>Visit https://heroui.com for more information. Contact us at info@heroui.com</NLinkify>
    </ComponentWrapper>
  );
};

export default Linkify;
