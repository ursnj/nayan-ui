'use client';

import { NLink } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Link = () => {
  return (
    <ComponentWrapper>
      <NLink href="https://heroui.com" target="_blank">
        HeroUI Documentation
      </NLink>
    </ComponentWrapper>
  );
};

export default Link;
