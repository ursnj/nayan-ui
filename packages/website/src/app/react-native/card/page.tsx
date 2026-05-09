import JsonLd from '@/helpers/JsonLd';
import RNCard from '@/react-native/components/Card';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/card', 'react-native');
export const metadata = pageMetadata;

export default function RNCardPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNCard />
    </>
  );
}
