import JsonLd from '@/helpers/JsonLd';
import Loading from '@/react/components/Loading';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/loading', 'react');
export const metadata = pageMetadata;

export default function LoadingPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Loading />
    </>
  );
}
