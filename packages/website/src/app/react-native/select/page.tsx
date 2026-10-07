import JsonLd from "@/components/helpers/JsonLd";
import RNSelect from "@/components/react-native/components/Select";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/select",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNSelectPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNSelect />
    </>
  );
}
