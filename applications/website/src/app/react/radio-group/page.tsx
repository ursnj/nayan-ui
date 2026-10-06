import JsonLd from "@/components/helpers/JsonLd";
import RadioGroup from "@/components/react/components/RadioGroup";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/radio-group", "react");
export const metadata = pageMetadata;

export default function RadioGroupPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RadioGroup />
    </>
  );
}
