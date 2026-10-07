import JsonLd from "@/components/helpers/JsonLd";
import Avatar from "@/components/react/components/Avatar";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/avatar", "react");
export const metadata = pageMetadata;

export default function AvatarPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Avatar />
    </>
  );
}
