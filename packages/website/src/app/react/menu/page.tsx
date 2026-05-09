import JsonLd from '@/helpers/JsonLd';
import Menu from '@/react/components/Menu';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/menu', 'react');
export const metadata = pageMetadata;

export default function MenuPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Menu />
    </>
  );
}
