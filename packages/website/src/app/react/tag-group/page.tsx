import JsonLd from '@/helpers/JsonLd';
import TagGroup from '@/react/components/TagGroup';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/tag-group', 'react');
export const metadata = pageMetadata;

export default function TagGroupPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <TagGroup />
    </>
  );
}
