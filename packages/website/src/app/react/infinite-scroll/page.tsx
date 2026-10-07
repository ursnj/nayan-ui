import JsonLd from "@/components/helpers/JsonLd";
import InfiniteScroll from "@/components/react/components/InfiniteScroll";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react/infinite-scroll",
  "react",
);
export const metadata = pageMetadata;

export default function InfiniteScrollPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <InfiniteScroll />
    </>
  );
}
