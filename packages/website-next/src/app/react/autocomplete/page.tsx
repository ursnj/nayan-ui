import JsonLd from '@/helpers/JsonLd';
import Autocomplete from '@/react/components/Autocomplete';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/autocomplete', 'react');
export const metadata = pageMetadata;

export default function AutocompletePage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Autocomplete />
    </>
  );
}
