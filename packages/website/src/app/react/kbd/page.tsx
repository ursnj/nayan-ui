import JsonLd from "@/components/helpers/JsonLd";
import KeyboardKey from "@/components/react/components/KeyboardKey";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/kbd", "react");
export const metadata = pageMetadata;

export default function KeyboardKeyPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <KeyboardKey />
    </>
  );
}
