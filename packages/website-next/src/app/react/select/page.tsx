import JsonLd from '@/helpers/JsonLd';
import Select from '@/react/components/Select';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/select', 'react');
export const metadata = pageMetadata;

export default function SelectPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Select />
    </>
  );
}
