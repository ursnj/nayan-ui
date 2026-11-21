import JsonLd from "@/components/helpers/JsonLd";
import NayanComponentDoc from "@/components/ui/NayanComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/date-field", "react");
export const metadata = pageMetadata;

export default function DateFieldPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <NayanComponentDoc path="/react/date-field" />
    </>
  );
}
