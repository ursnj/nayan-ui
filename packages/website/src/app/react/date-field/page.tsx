import JsonLd from "@/components/helpers/JsonLd";
import EngineComponentDoc from "@/components/ui/EngineComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/date-field", "react");
export const metadata = pageMetadata;

export default function DateFieldPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EngineComponentDoc path="/react/date-field" />
    </>
  );
}
