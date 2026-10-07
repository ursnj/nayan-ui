import JsonLd from "@/components/helpers/JsonLd";
import EmptyState from "@/components/react/components/EmptyState";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/empty-state", "react");
export const metadata = pageMetadata;

export default function EmptyStatePage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EmptyState />
    </>
  );
}
