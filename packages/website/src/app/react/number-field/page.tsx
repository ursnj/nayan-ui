import JsonLd from '@/helpers/JsonLd';
import NumberField from '@/react/components/NumberField';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/number-field', 'react');
export const metadata = pageMetadata;

export default function NumberFieldPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <NumberField />
    </>
  );
}
