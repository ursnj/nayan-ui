import JsonLd from '@/helpers/JsonLd';
import Checkbox from '@/react/components/Checkbox';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/checkbox', 'react');
export const metadata = pageMetadata;

export default function CheckboxPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Checkbox />
    </>
  );
}
