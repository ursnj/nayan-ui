import JsonLd from "@/components/helpers/JsonLd";
import NayanComponentDoc from "@/components/ui/NayanComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/progress", "react");
export const metadata = pageMetadata;

export default function ProgressPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <NayanComponentDoc path="/react/progress" />
    </>
  );
}
