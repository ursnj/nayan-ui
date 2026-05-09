import JsonLd from '@/helpers/JsonLd';
import Card from '@/react/components/Card';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/card', 'react');
export const metadata = pageMetadata;

export default function CardPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Card />
    </>
  );
}
