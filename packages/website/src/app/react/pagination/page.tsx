import JsonLd from "@/components/helpers/JsonLd";
import Pagination from "@/components/react/components/Pagination";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/pagination", "react");
export const metadata = pageMetadata;

export default function PaginationPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Pagination />
    </>
  );
}
