import JsonLd from '@/helpers/JsonLd';
import RNRadioGroup from '@/react-native/components/RadioGroup';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/radio-group', 'react-native');
export const metadata = pageMetadata;

export default function RNRadioGroupPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNRadioGroup />
    </>
  );
}
