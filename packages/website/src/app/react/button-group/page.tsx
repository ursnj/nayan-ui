import JsonLd from '@/helpers/JsonLd';
import ButtonGroup from '@/react/components/ButtonGroup';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/button-group', 'react');
export const metadata = pageMetadata;

export default function ButtonGroupPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <ButtonGroup />
    </>
  );
}
