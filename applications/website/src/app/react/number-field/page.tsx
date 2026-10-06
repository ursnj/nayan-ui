import JsonLd from "@/components/helpers/JsonLd";
import NumberField from "@/components/react/components/NumberField";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/number-field", "react");
export const metadata = pageMetadata;

export default function NumberFieldPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <NumberField />
    </>
  );
}
