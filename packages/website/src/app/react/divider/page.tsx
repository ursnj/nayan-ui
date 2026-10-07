import JsonLd from "@/components/helpers/JsonLd";
import Divider from "@/components/react/components/Divider";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/divider", "react");
export const metadata = pageMetadata;

export default function DividerPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Divider />
    </>
  );
}
