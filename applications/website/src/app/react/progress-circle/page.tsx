import JsonLd from "@/helpers/JsonLd";
import ProgressCircle from "@/react/components/ProgressCircle";
import { buildComponentPageSeo } from "@/services/seoHelpers";

export const dynamic = "force-dynamic";

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
