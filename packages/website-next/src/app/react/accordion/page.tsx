import JsonLd from '@/helpers/JsonLd';
import Accordion from '@/react/components/Accordion';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/accordion', 'react');
export const metadata = pageMetadata;

export default function AccordionPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Accordion />
    </>
  );
}
