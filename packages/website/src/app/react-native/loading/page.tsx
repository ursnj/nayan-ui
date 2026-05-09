import JsonLd from '@/helpers/JsonLd';
import RNLoading from '@/react-native/components/Loading';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/loading', 'react-native');
export const metadata = pageMetadata;

export default function RNLoadingPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNLoading />
    </>
  );
}
