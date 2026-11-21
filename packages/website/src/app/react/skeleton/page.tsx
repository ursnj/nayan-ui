import JsonLd from "@/components/helpers/JsonLd";
import NayanComponentDoc from "@/components/ui/NayanComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/skeleton", "react");
export const metadata = pageMetadata;

export default function SkeletonPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <NayanComponentDoc path="/react/skeleton" />
    </>
  );
}
