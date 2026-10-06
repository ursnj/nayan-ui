import JsonLd from "@/components/helpers/JsonLd";
import Table from "@/components/react/components/Table";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/table", "react");
export const metadata = pageMetadata;

export default function TablePage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Table />
    </>
  );
}
