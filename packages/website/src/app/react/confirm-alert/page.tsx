import JsonLd from '@/helpers/JsonLd';
import ConfirmAlert from '@/react/components/ConfirmAlert';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/confirm-alert', 'react');
export const metadata = pageMetadata;

export default function ConfirmAlertPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <ConfirmAlert />
    </>
  );
}
