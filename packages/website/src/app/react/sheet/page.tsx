import JsonLd from "@/components/helpers/JsonLd";
import Sheet from "@/components/react/components/Sheet";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/sheet", "react");
export const metadata = pageMetadata;

export default function SheetPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Sheet />
    </>
  );
}
