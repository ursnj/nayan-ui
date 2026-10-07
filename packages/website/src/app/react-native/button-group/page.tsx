import JsonLd from "@/components/helpers/JsonLd";
import RNButtonGroup from "@/components/react-native/components/ButtonGroup";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/button-group",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNButtonGroupPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNButtonGroup />
    </>
  );
}
