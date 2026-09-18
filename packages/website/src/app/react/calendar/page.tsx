import JsonLd from '@/helpers/JsonLd';
import Calendar from '@/react/components/Calendar';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/calendar', 'react');
export const metadata = pageMetadata;

export default function CalendarPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Calendar />
    </>
  );
}
