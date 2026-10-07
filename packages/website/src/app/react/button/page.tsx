import JsonLd from "@/components/helpers/JsonLd";
import Button from "@/components/react/components/Button";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/button", "react");
export const metadata = pageMetadata;

export default function ButtonPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Button />
    </>
  );
}
