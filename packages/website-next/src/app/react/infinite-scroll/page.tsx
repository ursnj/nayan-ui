import JsonLd from '@/helpers/JsonLd';
import InfiniteScroll from '@/react/components/InfiniteScroll';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/infinite-scroll', 'react');
export const metadata = pageMetadata;

export default function InfiniteScrollPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <InfiniteScroll />
    </>
  );
}
