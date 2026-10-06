import JsonLd from "@/components/helpers/JsonLd";
import RNAlert from "@/components/react-native/components/Alert";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/alert",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNAlertPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNAlert />
    </>
  );
}
