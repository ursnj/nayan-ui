import JsonLd from "@/components/helpers/JsonLd";
import ButtonGroup from "@/components/react/components/ButtonGroup";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/button-group", "react");
export const metadata = pageMetadata;

export default function ButtonGroupPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <ButtonGroup />
    </>
  );
}
