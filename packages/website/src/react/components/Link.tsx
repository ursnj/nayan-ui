'use client';

import { NLink } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Link = () => {
  return (
    <ComponentWrapper>
      <NLink href="/react/components">Browse the components</NLink>
      <NLink href="https://www.nayanui.com" target="_blank">
        Open nayanui.com in a new tab
      </NLink>
    </ComponentWrapper>
  );
};

export default Link;
