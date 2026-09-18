'use client';

import { NButton, NEmptyState } from '@nayan-ui/react';
import { Inbox } from 'lucide-react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const EmptyState = () => {
  return (
    <ComponentWrapper code={code}>
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

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NButton, NEmptyState } from '@nayan-ui/react';
import { Inbox } from 'lucide-react';

const EmptyState = () => {
  return (
    <div>
      <NEmptyState
        icon={<Inbox className="h-8 w-8" />}
        title="No projects yet"
        message="Create your first project and it will show up here."
        actions={<NButton>New project</NButton>}
      />
    </div>
  );
};

export default EmptyState;`;
