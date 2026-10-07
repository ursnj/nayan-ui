import JsonLd from "@/components/helpers/JsonLd";
import Loading from "@/components/react/components/Loading";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/loading", "react");
export const metadata = pageMetadata;

export default function LoadingPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Loading />
    </>
  );
}
