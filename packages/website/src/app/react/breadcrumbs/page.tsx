import JsonLd from "@/components/helpers/JsonLd";
import Breadcrumbs from "@/components/react/components/Breadcrumbs";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/breadcrumbs", "react");
export const metadata = pageMetadata;

export default function BreadcrumbsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Breadcrumbs />
    </>
  );
}
