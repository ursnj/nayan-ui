import JsonLd from '@/helpers/JsonLd';
import RNMenu from '@/react-native/components/Menu';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/menu', 'react-native');
export const metadata = pageMetadata;

export default function RNMenuPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNMenu />
    </>
  );
}
