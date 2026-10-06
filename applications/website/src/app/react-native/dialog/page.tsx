import JsonLd from "@/components/helpers/JsonLd";
import RNDialog from "@/components/react-native/components/Dialog";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/dialog",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNDialogPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNDialog />
    </>
  );
}
