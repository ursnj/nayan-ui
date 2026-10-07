import JsonLd from "@/components/helpers/JsonLd";
import Tabs from "@/components/react/components/Tabs";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/tabs", "react");
export const metadata = pageMetadata;

export default function TabsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Tabs />
    </>
  );
}
