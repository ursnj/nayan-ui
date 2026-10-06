import JsonLd from "@/components/helpers/JsonLd";
import Dialog from "@/components/react/components/Dialog";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/dialog", "react");
export const metadata = pageMetadata;

export default function DialogPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Dialog />
    </>
  );
}
