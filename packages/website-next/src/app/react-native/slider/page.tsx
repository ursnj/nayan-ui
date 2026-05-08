import JsonLd from '@/helpers/JsonLd';
import RNSlider from '@/react-native/components/Slider';
import { buildComponentPageSeo } from '@/services/seoHelpers';

export const dynamic = 'force-dynamic';

const { metadata: pageMetadata, schemas } = buildComponentPageSeo('/react-native/slider', 'react-native');
export const metadata = pageMetadata;

export default function RNSliderPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNSlider />
    </>
  );
}
