import JsonLd from '@/helpers/JsonLd';
import DateField from '@/react/components/DateField';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/date-field', 'react');
export const metadata = pageMetadata;

export default function DateFieldPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <DateField />
    </>
  );
}
