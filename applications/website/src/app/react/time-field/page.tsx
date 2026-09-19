import JsonLd from "@/helpers/JsonLd";
import TimeField from "@/react/components/TimeField";
import { buildComponentPageSeo } from "@/services/seoHelpers";

export const dynamic = "force-dynamic";

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
