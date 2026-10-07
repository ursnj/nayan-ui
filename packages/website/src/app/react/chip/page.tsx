import JsonLd from "@/components/helpers/JsonLd";
import Chip from "@/components/react/components/Chip";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/chip", "react");
export const metadata = pageMetadata;

export default function ChipPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Chip />
    </>
  );
}
