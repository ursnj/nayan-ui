import JsonLd from '@/helpers/JsonLd';
import Table from '@/react/components/Table';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/table', 'react');
export const metadata = pageMetadata;

export default function TablePage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Table />
    </>
  );
}
