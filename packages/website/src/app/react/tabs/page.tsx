import JsonLd from '@/helpers/JsonLd';
import Tabs from '@/react/components/Tabs';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/tabs', 'react');
export const metadata = pageMetadata;

export default function TabsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Tabs />
    </>
  );
}
