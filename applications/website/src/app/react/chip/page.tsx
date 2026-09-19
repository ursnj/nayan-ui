import JsonLd from "@/helpers/JsonLd";
import Chip from "@/react/components/Chip";
import { buildComponentPageSeo } from "@/services/seoHelpers";

export const dynamic = "force-dynamic";

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
