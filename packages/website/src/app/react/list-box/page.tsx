import JsonLd from "@/components/helpers/JsonLd";
import NayanComponentDoc from "@/components/ui/NayanComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/list-box", "react");
export const metadata = pageMetadata;

export default function ListBoxPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <NayanComponentDoc path="/react/list-box" />
    </>
  );
}
