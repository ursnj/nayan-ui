import JsonLd from '@/helpers/JsonLd';
import DateRangePicker from '@/react/components/DateRangePicker';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/date-range-picker', 'react');
export const metadata = pageMetadata;

export default function DateRangePickerPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <DateRangePicker />
    </>
  );
}
