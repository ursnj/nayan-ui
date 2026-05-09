import JsonLd from '@/helpers/JsonLd';
import RNSwitch from '@/react-native/components/Switch';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/switch', 'react-native');
export const metadata = pageMetadata;

export default function RNSwitchPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNSwitch />
    </>
  );
}
