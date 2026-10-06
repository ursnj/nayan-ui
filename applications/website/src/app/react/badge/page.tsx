import JsonLd from "@/components/helpers/JsonLd";
import Badge from "@/components/react/components/Badge";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/badge", "react");
export const metadata = pageMetadata;

export default function BadgePage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Badge />
    </>
  );
}
