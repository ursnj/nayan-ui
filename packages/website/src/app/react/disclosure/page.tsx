import JsonLd from '@/helpers/JsonLd';
import Disclosure from '@/react/components/Disclosure';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/disclosure', 'react');
export const metadata = pageMetadata;

export default function DisclosurePage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Disclosure />
    </>
  );
}
