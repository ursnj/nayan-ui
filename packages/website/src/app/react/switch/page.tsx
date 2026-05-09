import JsonLd from '@/helpers/JsonLd';
import Switch from '@/react/components/Switch';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/switch', 'react');
export const metadata = pageMetadata;

export default function SwitchPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Switch />
    </>
  );
}
