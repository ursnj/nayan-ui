import JsonLd from "@/components/helpers/JsonLd";
import Tooltip from "@/components/react/components/Tooltip";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/tooltip", "react");
export const metadata = pageMetadata;

export default function TooltipPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Tooltip />
    </>
  );
}
