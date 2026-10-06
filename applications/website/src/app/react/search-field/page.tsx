import JsonLd from "@/components/helpers/JsonLd";
import SearchField from "@/components/react/components/SearchField";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/search-field", "react");
export const metadata = pageMetadata;

export default function SearchFieldPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <SearchField />
    </>
  );
}
