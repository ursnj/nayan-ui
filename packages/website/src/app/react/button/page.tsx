import JsonLd from '@/helpers/JsonLd';
import Button from '@/react/components/Button';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/button', 'react');
export const metadata = pageMetadata;

export default function ButtonPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Button />
    </>
  );
}
