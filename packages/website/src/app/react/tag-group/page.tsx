import JsonLd from "@/components/helpers/JsonLd";
import NayanComponentDoc from "@/components/ui/NayanComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/tag-group", "react");
export const metadata = pageMetadata;

export default function TagGroupPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <NayanComponentDoc path="/react/tag-group" />
    </>
  );
}
