import JsonLd from "@/components/helpers/JsonLd";
import NayanComponentDoc from "@/components/ui/NayanComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/table", "react");
export const metadata = pageMetadata;

export default function TablePage() {
  return (
    <>
      <JsonLd data={schemas} />
      <NayanComponentDoc path="/react/table" />
    </>
  );
}
