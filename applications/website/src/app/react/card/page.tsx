import JsonLd from "@/components/helpers/JsonLd";
import Card from "@/components/react/components/Card";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/card", "react");
export const metadata = pageMetadata;

export default function CardPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Card />
    </>
  );
}
