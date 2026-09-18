'use client';

import { NAvatarGroup } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const members = [{ fallback: 'ND' }, { fallback: 'AK' }, { fallback: 'RS' }, { fallback: 'JP' }, { fallback: 'MM' }];

const AvatarGroup = () => {
  return (
    <ComponentWrapper>
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
