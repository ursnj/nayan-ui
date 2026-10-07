import JsonLd from "@/components/helpers/JsonLd";
import Progress from "@/components/react/components/Progress";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/progress", "react");
export const metadata = pageMetadata;

export default function ProgressPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Progress />
    </>
  );
}
