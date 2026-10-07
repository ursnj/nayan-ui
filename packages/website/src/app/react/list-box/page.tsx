import JsonLd from "@/components/helpers/JsonLd";
import ListBox from "@/components/react/components/ListBox";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/list-box", "react");
export const metadata = pageMetadata;

export default function ListBoxPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <ListBox />
    </>
  );
}
