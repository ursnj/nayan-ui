import JsonLd from "@/components/helpers/JsonLd";
import Popover from "@/components/react/components/Popover";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/popover", "react");
export const metadata = pageMetadata;

export default function PopoverPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Popover />
    </>
  );
}
