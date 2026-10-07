import JsonLd from "@/components/helpers/JsonLd";
import CheckboxGroup from "@/components/react/components/CheckboxGroup";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/checkbox-group", "react");
export const metadata = pageMetadata;

export default function CheckboxGroupPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <CheckboxGroup />
    </>
  );
}
