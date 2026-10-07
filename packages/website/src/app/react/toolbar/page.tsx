import JsonLd from "@/components/helpers/JsonLd";
import Toolbar from "@/components/react/components/Toolbar";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/toolbar", "react");
export const metadata = pageMetadata;

export default function ToolbarPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Toolbar />
    </>
  );
}
