import JsonLd from '@/helpers/JsonLd';
import Badge from '@/react/components/Badge';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/badge', 'react');
export const metadata = pageMetadata;

export default function BadgePage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Badge />
    </>
  );
}
