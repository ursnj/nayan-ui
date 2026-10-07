import JsonLd from "@/components/helpers/JsonLd";
import RNButton from "@/components/react-native/components/Button";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/button",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNButtonPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNButton />
    </>
  );
}
