import JsonLd from "@/components/helpers/JsonLd";
import Skeleton from "@/components/react/components/Skeleton";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/skeleton", "react");
export const metadata = pageMetadata;

export default function SkeletonPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Skeleton />
    </>
  );
}
