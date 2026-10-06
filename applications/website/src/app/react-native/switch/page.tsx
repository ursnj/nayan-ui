import JsonLd from "@/components/helpers/JsonLd";
import RNSwitch from "@/components/react-native/components/Switch";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/switch",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNSwitchPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNSwitch />
    </>
  );
}
