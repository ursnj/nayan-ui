import JsonLd from '@/helpers/JsonLd';
import RNCheckbox from '@/react-native/components/Checkbox';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/checkbox', 'react-native');
export const metadata = pageMetadata;

export default function RNCheckboxPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNCheckbox />
    </>
  );
}
