import JsonLd from '@/helpers/JsonLd';
import Textarea from '@/react/components/Textarea';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/textarea', 'react');
export const metadata = pageMetadata;

export default function TextareaPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Textarea />
    </>
  );
}
