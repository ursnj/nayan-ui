import JsonLd from "@/components/helpers/JsonLd";
import Alert from "@/components/react/components/Alert";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/alert", "react");
export const metadata = pageMetadata;

export default function AlertPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Alert />
    </>
  );
}
