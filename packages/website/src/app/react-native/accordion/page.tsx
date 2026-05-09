import JsonLd from '@/helpers/JsonLd';
import RNAccordion from '@/react-native/components/Accordion';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/accordion', 'react-native');
export const metadata = pageMetadata;

export default function RNAccordionPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNAccordion />
    </>
  );
}
