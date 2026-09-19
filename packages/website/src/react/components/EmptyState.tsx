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

export const emptyStateAttributes = [
  { name: 'title', type: 'ReactNode', default: 'Required', details: 'The title prop.' },
  { name: 'message', type: 'ReactNode', default: 'Optional', details: 'The message prop.' },
  { name: 'icon', type: 'ReactNode', default: 'Optional', details: 'Shown above the title — an icon or a small illustration.' },
  { name: 'actions', type: 'ReactNode', default: 'Optional', details: 'Buttons or links under the message.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'iconClassName', type: 'string', default: "''", details: 'The iconClassName prop.' },
  { name: 'titleClassName', type: 'string', default: "''", details: 'The titleClassName prop.' },
  { name: 'messageClassName', type: 'string', default: "''", details: 'The messageClassName prop.' },
  { name: 'actionsClassName', type: 'string', default: "''", details: 'The actionsClassName prop.' },
  { name: 'children', type: 'ReactNode', default: 'Optional', details: 'The children prop.' }
];
