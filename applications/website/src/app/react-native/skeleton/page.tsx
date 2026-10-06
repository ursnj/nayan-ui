import JsonLd from "@/components/helpers/JsonLd";
import RNSkeleton from "@/components/react-native/components/Skeleton";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/skeleton",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNSkeletonPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNSkeleton />
    </>
  );
}
