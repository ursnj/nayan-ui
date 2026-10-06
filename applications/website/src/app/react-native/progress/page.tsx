import JsonLd from "@/components/helpers/JsonLd";
import RNProgress from "@/components/react-native/components/Progress";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/progress",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNProgressPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNProgress />
    </>
  );
}
