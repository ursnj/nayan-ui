import JsonLd from "@/components/helpers/JsonLd";
import RNTextarea from "@/components/react-native/components/Textarea";
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
      <RNTextarea />
    </>
  );
}
