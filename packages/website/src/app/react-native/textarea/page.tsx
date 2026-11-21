import JsonLd from "@/components/helpers/JsonLd";
import NayanComponentDoc from "@/components/ui/NayanComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/textarea",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNTextareaPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <NayanComponentDoc path="/react-native/textarea" />
    </>
  );
}
