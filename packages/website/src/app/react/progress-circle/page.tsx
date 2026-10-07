import JsonLd from "@/components/helpers/JsonLd";
import ProgressCircle from "@/components/react/components/ProgressCircle";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react/progress-circle",
  "react",
);
export const metadata = pageMetadata;

export default function ProgressCirclePage() {
  return (
    <>
      <JsonLd data={schemas} />
      <ProgressCircle />
    </>
  );
}
