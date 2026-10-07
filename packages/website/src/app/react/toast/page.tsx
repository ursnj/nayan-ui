import JsonLd from "@/components/helpers/JsonLd";
import Toast from "@/components/react/components/Toast";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/toast", "react");
export const metadata = pageMetadata;

export default function ToastPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Toast />
    </>
  );
}
