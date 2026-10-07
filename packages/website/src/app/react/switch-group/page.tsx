import JsonLd from "@/components/helpers/JsonLd";
import SwitchGroup from "@/components/react/components/SwitchGroup";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/switch-group", "react");
export const metadata = pageMetadata;

export default function SwitchGroupPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <SwitchGroup />
    </>
  );
}
