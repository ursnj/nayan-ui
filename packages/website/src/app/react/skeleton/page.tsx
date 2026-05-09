import JsonLd from '@/helpers/JsonLd';
import Skeleton from '@/react/components/Skeleton';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/skeleton', 'react');
export const metadata = pageMetadata;

export default function SkeletonPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Skeleton />
    </>
  );
}
