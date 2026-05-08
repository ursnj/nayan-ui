import JsonLd from '@/helpers/JsonLd';
import RNButton from '@/react-native/components/Button';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/button', 'react-native');
export const metadata = pageMetadata;

export default function RNButtonPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNButton />
    </>
  );
}
