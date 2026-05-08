import JsonLd from '@/helpers/JsonLd';
import RNTextarea from '@/react-native/components/Textarea';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/textarea', 'react-native');
export const metadata = pageMetadata;

export default function RNTextareaPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNTextarea />
    </>
  );
}
