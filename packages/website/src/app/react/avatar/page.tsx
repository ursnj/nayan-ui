import JsonLd from '@/helpers/JsonLd';
import Avatar from '@/react/components/Avatar';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/avatar', 'react');
export const metadata = pageMetadata;

export default function AvatarPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Avatar />
    </>
  );
}
