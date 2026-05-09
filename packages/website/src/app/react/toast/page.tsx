import JsonLd from '@/helpers/JsonLd';
import Toast from '@/react/components/Toast';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/toast', 'react');
export const metadata = pageMetadata;

export default function ToastPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Toast />
    </>
  );
}
