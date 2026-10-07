import JsonLd from "@/components/helpers/JsonLd";
import RNAccordion from "@/components/react-native/components/Accordion";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/accordion",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNAccordionPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNAccordion />
    </>
  );
}
