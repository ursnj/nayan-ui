import JsonLd from '@/helpers/JsonLd';
import ScrollShadow from '@/react/components/ScrollShadow';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/scroll-shadow', 'react');
export const metadata = pageMetadata;

export default function ScrollShadowPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <ScrollShadow />
    </>
  );
}
