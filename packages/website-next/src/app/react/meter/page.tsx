import JsonLd from '@/helpers/JsonLd';
import Meter from '@/react/components/Meter';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/meter', 'react');
export const metadata = pageMetadata;

export default function MeterPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Meter />
    </>
  );
}
