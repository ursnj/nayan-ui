import JsonLd from '@/helpers/JsonLd';
import RadioGroup from '@/react/components/RadioGroup';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/radio-group', 'react');
export const metadata = pageMetadata;

export default function RadioGroupPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RadioGroup />
    </>
  );
}
