import JsonLd from "@/components/helpers/JsonLd";
import Select from "@/components/react/components/Select";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/select", "react");
export const metadata = pageMetadata;

export default function SelectPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Select />
    </>
  );
}
