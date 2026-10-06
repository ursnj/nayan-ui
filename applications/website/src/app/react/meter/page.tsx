import JsonLd from "@/components/helpers/JsonLd";
import Meter from "@/components/react/components/Meter";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/meter", "react");
export const metadata = pageMetadata;

export default function MeterPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Meter />
    </>
  );
}
