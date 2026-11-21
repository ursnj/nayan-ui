import JsonLd from "@/components/helpers/JsonLd";
import EngineComponentDoc from "@/components/ui/EngineComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/textarea", "react");
export const metadata = pageMetadata;

export default function TextareaPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EngineComponentDoc path="/react/textarea" />
    </>
  );
}
