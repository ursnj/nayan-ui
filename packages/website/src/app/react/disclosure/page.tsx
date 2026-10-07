import JsonLd from "@/components/helpers/JsonLd";
import Disclosure from "@/components/react/components/Disclosure";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/disclosure", "react");
export const metadata = pageMetadata;

export default function DisclosurePage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Disclosure />
    </>
  );
}
