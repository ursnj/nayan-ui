import JsonLd from '@/helpers/JsonLd';
import RNTabs from '@/react-native/components/Tabs';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/tabs', 'react-native');
export const metadata = pageMetadata;

export default function RNTabsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNTabs />
    </>
  );
}
