import JsonLd from "@/components/helpers/JsonLd";
import Slider from "@/components/react/components/Slider";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/slider", "react");
export const metadata = pageMetadata;

export default function SliderPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Slider />
    </>
  );
}
