import JsonLd from '@/helpers/JsonLd';
import Link from '@/react/components/Link';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/link', 'react');
export const metadata = pageMetadata;

export default function LinkPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Link />
    </>
  );
}
