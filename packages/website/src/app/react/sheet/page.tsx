import JsonLd from '@/helpers/JsonLd';
import Sheet from '@/react/components/Sheet';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/sheet', 'react');
export const metadata = pageMetadata;

export default function SheetPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Sheet />
    </>
  );
}
