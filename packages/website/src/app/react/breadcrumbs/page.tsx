import JsonLd from '@/helpers/JsonLd';
import Breadcrumbs from '@/react/components/Breadcrumbs';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/breadcrumbs', 'react');
export const metadata = pageMetadata;

export default function BreadcrumbsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Breadcrumbs />
    </>
  );
}
