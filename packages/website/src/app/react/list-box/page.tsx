import JsonLd from '@/helpers/JsonLd';
import ListBox from '@/react/components/ListBox';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/list-box', 'react');
export const metadata = pageMetadata;

export default function ListBoxPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <ListBox />
    </>
  );
}
