import JsonLd from "@/components/helpers/JsonLd";
import EngineComponentDoc from "@/components/ui/EngineComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/sheet",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNSheetPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EngineComponentDoc path="/react-native/sheet" />
    </>
  );
}
