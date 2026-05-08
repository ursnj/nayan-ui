import JsonLd from '@/helpers/JsonLd';
import RNDivider from '@/react-native/components/Divider';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/divider', 'react-native');
export const metadata = pageMetadata;

export default function RNDividerPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNDivider />
    </>
  );
}
