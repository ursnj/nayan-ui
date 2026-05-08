import JsonLd from '@/helpers/JsonLd';
import RNSelect from '@/react-native/components/Select';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/select', 'react-native');
export const metadata = pageMetadata;

export default function RNSelectPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNSelect />
    </>
  );
}
