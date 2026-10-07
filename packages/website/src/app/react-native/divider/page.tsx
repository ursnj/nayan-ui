import JsonLd from "@/components/helpers/JsonLd";
import RNDivider from "@/components/react-native/components/Divider";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/divider",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNDividerPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNDivider />
    </>
  );
}
