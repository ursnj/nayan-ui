import JsonLd from "@/components/helpers/JsonLd";
import NayanComponentDoc from "@/components/ui/NayanComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/toolbar", "react");
export const metadata = pageMetadata;

export default function ToolbarPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <NayanComponentDoc path="/react/toolbar" />
    </>
  );
}
