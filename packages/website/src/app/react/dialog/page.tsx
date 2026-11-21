import JsonLd from "@/components/helpers/JsonLd";
import EngineComponentDoc from "@/components/ui/EngineComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/dialog", "react");
export const metadata = pageMetadata;

export default function DialogPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EngineComponentDoc path="/react/dialog" />
    </>
  );
}
