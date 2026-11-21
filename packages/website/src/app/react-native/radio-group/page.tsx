import JsonLd from "@/components/helpers/JsonLd";
import NayanComponentDoc from "@/components/ui/NayanComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/radio-group",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNRadioGroupPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <NayanComponentDoc path="/react-native/radio-group" />
    </>
  );
}
