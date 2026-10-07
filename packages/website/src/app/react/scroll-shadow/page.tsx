import JsonLd from "@/components/helpers/JsonLd";
import ScrollShadow from "@/components/react/components/ScrollShadow";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/scroll-shadow", "react");
export const metadata = pageMetadata;

export default function ScrollShadowPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <ScrollShadow />
    </>
  );
}
