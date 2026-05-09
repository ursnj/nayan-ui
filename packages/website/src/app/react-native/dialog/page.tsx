import JsonLd from '@/helpers/JsonLd';
import RNDialog from '@/react-native/components/Dialog';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/dialog', 'react-native');
export const metadata = pageMetadata;

export default function RNDialogPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNDialog />
    </>
  );
}
