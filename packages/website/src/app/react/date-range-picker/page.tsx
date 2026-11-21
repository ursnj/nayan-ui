import JsonLd from "@/components/helpers/JsonLd";
import NayanComponentDoc from "@/components/ui/NayanComponentDoc";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react/date-range-picker",
  "react",
);
export const metadata = pageMetadata;

export default function DateRangePickerPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <NayanComponentDoc path="/react/date-range-picker" />
    </>
  );
}
