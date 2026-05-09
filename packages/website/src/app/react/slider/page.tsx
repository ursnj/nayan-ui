import JsonLd from '@/helpers/JsonLd';
import Slider from '@/react/components/Slider';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react/slider', 'react');
export const metadata = pageMetadata;

export default function SliderPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Slider />
    </>
  );
}
