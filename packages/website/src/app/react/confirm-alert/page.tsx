import JsonLd from "@/components/helpers/JsonLd";
import NayanComponentDoc from "@/components/ui/NayanComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/confirm-alert", "react");
export const metadata = pageMetadata;

export default function ConfirmAlertPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <NayanComponentDoc path="/react/confirm-alert" />
    </>
  );
}
