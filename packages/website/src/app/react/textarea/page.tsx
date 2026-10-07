import JsonLd from "@/components/helpers/JsonLd";
import Textarea from "@/components/react/components/Textarea";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/textarea", "react");
export const metadata = pageMetadata;

export default function TextareaPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Textarea />
    </>
  );
}
