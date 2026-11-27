import JsonLd from "@/components/helpers/JsonLd";
import NayanComponentDoc from "@/components/ui/NayanComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/meter", "react");
export const metadata = pageMetadata;

export default function MeterPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <NayanComponentDoc path="/react/meter" />
    </>
  );
}
