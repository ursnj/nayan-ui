'use client';

import { NButton, NEmptyState } from '@nayan-ui/react';
import { Inbox } from 'lucide-react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const EmptyState = () => {
  return (
    <ComponentWrapper>
      <NEmptyState
        icon={<Inbox className="h-8 w-8" />}
        title="No projects yet"
        message="Create your first project and it will show up here."
        actions={<NButton>New project</NButton>}
      />
    </ComponentWrapper>
  );
};

export default EmptyState;
