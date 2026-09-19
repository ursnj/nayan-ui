import JsonLd from "@/helpers/JsonLd";
import ToggleButton from "@/react/components/ToggleButton";
import { buildComponentPageSeo } from "@/services/seoHelpers";

export const dynamic = "force-dynamic";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/toggle-button", "react");
export const metadata = pageMetadata;

export default function ToggleButtonPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <ToggleButton />
    </>
  );
}
