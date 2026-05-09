import JsonLd from '@/helpers/JsonLd';
import Input from '@/react/components/Input';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/input', 'react');
export const metadata = pageMetadata;

export default function InputPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Input />
    </>
  );
}
