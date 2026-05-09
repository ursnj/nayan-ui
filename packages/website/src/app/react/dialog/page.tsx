import JsonLd from '@/helpers/JsonLd';
import Dialog from '@/react/components/Dialog';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/dialog', 'react');
export const metadata = pageMetadata;

export default function DialogPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Dialog />
    </>
  );
}
