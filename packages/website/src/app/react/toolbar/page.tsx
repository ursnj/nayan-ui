import JsonLd from '@/helpers/JsonLd';
import Toolbar from '@/react/components/Toolbar';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/toolbar', 'react');
export const metadata = pageMetadata;

export default function ToolbarPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Toolbar />
    </>
  );
}
