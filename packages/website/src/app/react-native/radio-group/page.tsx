import JsonLd from "@/components/helpers/JsonLd";
import RNRadioGroup from "@/components/react-native/components/RadioGroup";
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
      <RNRadioGroup />
    </>
  );
}
