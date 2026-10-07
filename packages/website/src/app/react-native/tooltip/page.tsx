import JsonLd from "@/components/helpers/JsonLd";
import RNTooltip from "@/components/react-native/components/Tooltip";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/tooltip",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNTooltipPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNTooltip />
    </>
  );
}
