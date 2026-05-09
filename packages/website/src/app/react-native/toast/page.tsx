import JsonLd from '@/helpers/JsonLd';
import RNToast from '@/react-native/components/Toast';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/toast', 'react-native');
export const metadata = pageMetadata;

export default function RNToastPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNToast />
    </>
  );
}
