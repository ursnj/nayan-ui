import JsonLd from "@/components/helpers/JsonLd";
import RNPopover from "@/components/react-native/components/Popover";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/popover",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNPopoverPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNPopover />
    </>
  );
}
