import JsonLd from "@/components/helpers/JsonLd";
import Input from "@/components/react/components/Input";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/input", "react");
export const metadata = pageMetadata;

export default function InputPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Input />
    </>
  );
}
