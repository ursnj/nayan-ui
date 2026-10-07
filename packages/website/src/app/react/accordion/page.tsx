import JsonLd from "@/components/helpers/JsonLd";
import Accordion from "@/components/react/components/Accordion";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/accordion", "react");
export const metadata = pageMetadata;

export default function AccordionPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Accordion />
    </>
  );
}
