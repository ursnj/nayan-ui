'use client';

import { NAvatar } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Avatar = () => {
  return (
    <ComponentWrapper code={code}>
      <h3 className={H3_DOC}>Colors:</h3>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <NAvatar fallback="ND" />
        <NAvatar fallback="AK" color="accent" variant="soft" />
        <NAvatar fallback="RS" color="success" variant="soft" />
        <NAvatar fallback="JP" color="warning" variant="soft" />
        <NAvatar fallback="MM" color="danger" variant="soft" />
      </div>

      <h3 className={H3_DOC}>Sizes:</h3>
      <div className="flex flex-wrap items-center gap-2">
        <NAvatar fallback="SM" size="sm" color="accent" variant="soft" />
        <NAvatar fallback="MD" size="md" color="accent" variant="soft" />
        <NAvatar fallback="LG" size="lg" color="accent" variant="soft" />
      </div>
    </ComponentWrapper>
  );
};

export default Avatar;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NAvatar } from '@nayan-ui/react';

const Avatar = () => {
  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Colors:</h3>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <NAvatar fallback="ND" />
        <NAvatar fallback="AK" color="accent" variant="soft" />
        <NAvatar fallback="RS" color="success" variant="soft" />
        <NAvatar fallback="JP" color="warning" variant="soft" />
        <NAvatar fallback="MM" color="danger" variant="soft" />
      </div>

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Sizes:</h3>
      <div className="flex flex-wrap items-center gap-2">
        <NAvatar fallback="SM" size="sm" color="accent" variant="soft" />
        <NAvatar fallback="MD" size="md" color="accent" variant="soft" />
        <NAvatar fallback="LG" size="lg" color="accent" variant="soft" />
      </div>
    </div>
  );
};

export default Avatar;`;
