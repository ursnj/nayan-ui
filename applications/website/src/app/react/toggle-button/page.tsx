import JsonLd from "@/components/helpers/JsonLd";
import ToggleButton from "@/components/react/components/ToggleButton";
import { buildComponentPageSeo } from "@/services/seoHelpers";

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
