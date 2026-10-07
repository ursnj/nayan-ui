import JsonLd from "@/components/helpers/JsonLd";
import RNSlider from "@/components/react-native/components/Slider";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/slider",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNSliderPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNSlider />
    </>
  );
}
