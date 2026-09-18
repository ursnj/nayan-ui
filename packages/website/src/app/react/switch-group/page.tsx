import JsonLd from '@/helpers/JsonLd';
import SwitchGroup from '@/react/components/SwitchGroup';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/switch-group', 'react');
export const metadata = pageMetadata;

export default function SwitchGroupPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <SwitchGroup />
    </>
  );
}
