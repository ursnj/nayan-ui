import JsonLd from '@/helpers/JsonLd';
import DatePicker from '@/react/components/DatePicker';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/date-picker', 'react');
export const metadata = pageMetadata;

export default function DatePickerPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <DatePicker />
    </>
  );
}
