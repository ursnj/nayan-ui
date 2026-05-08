import JsonLd from '@/helpers/JsonLd';
import SearchField from '@/react/components/SearchField';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/search-field', 'react');
export const metadata = pageMetadata;

export default function SearchFieldPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <SearchField />
    </>
  );
}
