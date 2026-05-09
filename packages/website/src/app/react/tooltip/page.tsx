import JsonLd from '@/helpers/JsonLd';
import Tooltip from '@/react/components/Tooltip';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/tooltip', 'react');
export const metadata = pageMetadata;

export default function TooltipPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Tooltip />
    </>
  );
}
