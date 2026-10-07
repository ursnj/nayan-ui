import JsonLd from "@/components/helpers/JsonLd";
import RNSheet from "@/components/react-native/components/Sheet";
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
      <RNSheet />
    </>
  );
}
