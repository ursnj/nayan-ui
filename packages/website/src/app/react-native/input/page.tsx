import JsonLd from "@/components/helpers/JsonLd";
import NayanComponentDoc from "@/components/ui/NayanComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/input",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNInputPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <NayanComponentDoc path="/react-native/input" />
    </>
  );
}
