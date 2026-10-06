import JsonLd from "@/components/helpers/JsonLd";
import TimeField from "@/components/react/components/TimeField";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/time-field", "react");
export const metadata = pageMetadata;

export default function TimeFieldPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <TimeField />
    </>
  );
}
