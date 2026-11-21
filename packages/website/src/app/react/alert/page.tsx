import JsonLd from "@/components/helpers/JsonLd";
import EngineComponentDoc from "@/components/ui/EngineComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/alert", "react");
export const metadata = pageMetadata;

export default function AlertPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EngineComponentDoc path="/react/alert" />
    </>
  );
}
