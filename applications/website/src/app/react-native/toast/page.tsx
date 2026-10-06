import JsonLd from "@/components/helpers/JsonLd";
import RNToast from "@/components/react-native/components/Toast";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/toast",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNToastPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNToast />
    </>
  );
}
