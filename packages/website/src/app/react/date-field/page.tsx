import JsonLd from "@/components/helpers/JsonLd";
import DateField from "@/components/react/components/DateField";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/date-field", "react");
export const metadata = pageMetadata;

export default function DateFieldPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <DateField />
    </>
  );
}
