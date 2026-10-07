import JsonLd from "@/components/helpers/JsonLd";
import Link from "@/components/react/components/Link";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/link", "react");
export const metadata = pageMetadata;

export default function LinkPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Link />
    </>
  );
}
