import JsonLd from "@/components/helpers/JsonLd";
import AvatarGroup from "@/components/react/components/AvatarGroup";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/avatar-group", "react");
export const metadata = pageMetadata;

export default function AvatarGroupPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <AvatarGroup />
    </>
  );
}
