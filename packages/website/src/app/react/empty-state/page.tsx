import JsonLd from '@/helpers/JsonLd';
import EmptyState from '@/react/components/EmptyState';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/empty-state', 'react');
export const metadata = pageMetadata;

export default function EmptyStatePage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EmptyState />
    </>
  );
}
