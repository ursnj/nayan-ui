import JsonLd from '@/helpers/JsonLd';
import RNAlert from '@/react-native/components/Alert';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/alert', 'react-native');
export const metadata = pageMetadata;

export default function RNAlertPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNAlert />
    </>
  );
}
