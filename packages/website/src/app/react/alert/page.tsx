import JsonLd from '@/helpers/JsonLd';
import Alert from '@/react/components/Alert';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/alert', 'react');
export const metadata = pageMetadata;

export default function AlertPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Alert />
    </>
  );
}
