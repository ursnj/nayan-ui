import JsonLd from "@/components/helpers/JsonLd";
import RNCheckbox from "@/components/react-native/components/Checkbox";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/checkbox",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNCheckboxPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNCheckbox />
    </>
  );
}
