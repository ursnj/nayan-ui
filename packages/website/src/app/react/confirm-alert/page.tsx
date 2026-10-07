import JsonLd from "@/components/helpers/JsonLd";
import ConfirmAlert from "@/components/react/components/ConfirmAlert";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/confirm-alert", "react");
export const metadata = pageMetadata;

export default function ConfirmAlertPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <ConfirmAlert />
    </>
  );
}
