import JsonLd from "@/components/helpers/JsonLd";
import RNTabs from "@/components/react-native/components/Tabs";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/tabs",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNTabsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNTabs />
    </>
  );
}
