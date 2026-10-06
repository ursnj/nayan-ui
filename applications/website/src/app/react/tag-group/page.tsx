import JsonLd from "@/components/helpers/JsonLd";
import TagGroup from "@/components/react/components/TagGroup";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/tag-group", "react");
export const metadata = pageMetadata;

export default function TagGroupPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <TagGroup />
    </>
  );
}
