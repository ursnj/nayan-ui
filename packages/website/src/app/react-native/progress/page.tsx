import JsonLd from '@/helpers/JsonLd';
import RNProgress from '@/react-native/components/Progress';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/progress', 'react-native');
export const metadata = pageMetadata;

export default function RNProgressPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNProgress />
    </>
  );
}
