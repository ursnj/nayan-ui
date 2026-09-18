import JsonLd from '@/helpers/JsonLd';
import KeyboardKey from '@/react/components/KeyboardKey';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/kbd', 'react');
export const metadata = pageMetadata;

export default function KeyboardKeyPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <KeyboardKey />
    </>
  );
}
