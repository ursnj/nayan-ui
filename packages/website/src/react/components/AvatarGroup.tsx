'use client';

import { NAvatarGroup } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const members = [{ fallback: 'ND' }, { fallback: 'AK' }, { fallback: 'RS' }, { fallback: 'JP' }, { fallback: 'MM' }];

const AvatarGroup = () => {
  return (
    <ComponentWrapper code={code}>
      <h3 className={H3_DOC}>Collapsed after three:</h3>
      <div className="mb-5">
        <NAvatarGroup items={members} max={3} color="accent" variant="soft" />
      </div>

      <h3 className={H3_DOC}>All of them, as a grid:</h3>
      <NAvatarGroup items={members} isGrid color="accent" variant="soft" />
    </ComponentWrapper>
  );
};

export default AvatarGroup;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NAvatarGroup } from '@nayan-ui/react';

const members = [{ fallback: 'ND' }, { fallback: 'AK' }, { fallback: 'RS' }, { fallback: 'JP' }, { fallback: 'MM' }];

const AvatarGroup = () => {
  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Collapsed after three:</h3>
      <div className="mb-5">
        <NAvatarGroup items={members} max={3} color="accent" variant="soft" />
      </div>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">All of them, as a grid:</h3>
      <NAvatarGroup items={members} isGrid color="accent" variant="soft" />
    </div>
  );
};

export default AvatarGroup;`;
