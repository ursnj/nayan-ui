import JsonLd from "@/components/helpers/JsonLd";
import RNLoading from "@/components/react-native/components/Loading";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/loading",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNLoadingPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNLoading />
    </>
  );
}
