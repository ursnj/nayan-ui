import JsonLd from "@/components/helpers/JsonLd";
import Switch from "@/components/react/components/Switch";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/switch", "react");
export const metadata = pageMetadata;

export default function SwitchPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Switch />
    </>
  );
}
