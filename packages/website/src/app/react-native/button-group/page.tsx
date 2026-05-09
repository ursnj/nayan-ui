import JsonLd from '@/helpers/JsonLd';
import RNButtonGroup from '@/react-native/components/ButtonGroup';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/button-group', 'react-native');
export const metadata = pageMetadata;

export default function RNButtonGroupPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNButtonGroup />
    </>
  );
}
