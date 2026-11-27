import JsonLd from "@/components/helpers/JsonLd";
import NayanComponentDoc from "@/components/ui/NayanComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/divider", "react");
export const metadata = pageMetadata;

export default function DividerPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <NayanComponentDoc path="/react/divider" />
    </>
  );
}
