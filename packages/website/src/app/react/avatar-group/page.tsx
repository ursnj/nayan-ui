import JsonLd from '@/helpers/JsonLd';
import AvatarGroup from '@/react/components/AvatarGroup';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/avatar-group', 'react');
export const metadata = pageMetadata;

export default function AvatarGroupPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <AvatarGroup />
    </>
  );
}
