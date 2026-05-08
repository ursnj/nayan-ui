import JsonLd from '@/helpers/JsonLd';
import RNSkeleton from '@/react-native/components/Skeleton';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/skeleton', 'react-native');
export const metadata = pageMetadata;

export default function RNSkeletonPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNSkeleton />
    </>
  );
}
