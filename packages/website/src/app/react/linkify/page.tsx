import JsonLd from "@/components/helpers/JsonLd";
import Linkify from "@/components/react/components/Linkify";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/linkify", "react");
export const metadata = pageMetadata;

export default function LinkifyPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Linkify />
    </>
  );
}
