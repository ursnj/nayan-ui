import JsonLd from "@/helpers/JsonLd";
import CheckboxGroup from "@/react/components/CheckboxGroup";
import { buildComponentPageSeo } from "@/services/seoHelpers";

export const dynamic = "force-dynamic";

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
