import JsonLd from "@/components/helpers/JsonLd";
import Menu from "@/components/react/components/Menu";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/menu", "react");
export const metadata = pageMetadata;

export default function MenuPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Menu />
    </>
  );
}
