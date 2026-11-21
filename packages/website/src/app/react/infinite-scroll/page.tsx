import JsonLd from "@/components/helpers/JsonLd";
import NayanComponentDoc from "@/components/ui/NayanComponentDoc";
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
      <NayanComponentDoc path="/react/infinite-scroll" />
    </>
  );
}
