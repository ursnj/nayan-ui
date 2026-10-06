import JsonLd from "@/components/helpers/JsonLd";
import Checkbox from "@/components/react/components/Checkbox";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/checkbox", "react");
export const metadata = pageMetadata;

export default function CheckboxPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Checkbox />
    </>
  );
}
