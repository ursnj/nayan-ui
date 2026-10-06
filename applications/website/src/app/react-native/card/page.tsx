import JsonLd from "@/components/helpers/JsonLd";
import RNCard from "@/components/react-native/components/Card";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/card",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNCardPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNCard />
    </>
  );
}
