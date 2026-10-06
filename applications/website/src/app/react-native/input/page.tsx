import JsonLd from "@/components/helpers/JsonLd";
import RNInput from "@/components/react-native/components/Input";
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
      <RNInput />
    </>
  );
}
