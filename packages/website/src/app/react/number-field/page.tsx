import JsonLd from "@/components/helpers/JsonLd";
import EngineComponentDoc from "@/components/ui/EngineComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/number-field", "react");
export const metadata = pageMetadata;

export default function NumberFieldPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EngineComponentDoc path="/react/number-field" />
    </>
  );
}
