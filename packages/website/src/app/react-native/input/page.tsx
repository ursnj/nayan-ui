import JsonLd from '@/helpers/JsonLd';
import RNInput from '@/react-native/components/Input';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/input', 'react-native');
export const metadata = pageMetadata;

export default function RNInputPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNInput />
    </>
  );
}
