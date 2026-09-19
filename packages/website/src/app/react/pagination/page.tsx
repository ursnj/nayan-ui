import JsonLd from "@/helpers/JsonLd";
import Pagination from "@/react/components/Pagination";
import { buildComponentPageSeo } from "@/services/seoHelpers";

export const dynamic = "force-dynamic";

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
