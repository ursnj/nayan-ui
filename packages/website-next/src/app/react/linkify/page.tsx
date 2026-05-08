import JsonLd from '@/helpers/JsonLd';
import Linkify from '@/react/components/Linkify';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/linkify', 'react');
export const metadata = pageMetadata;

export default function LinkifyPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Linkify />
    </>
  );
}
