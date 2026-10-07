import JsonLd from "@/components/helpers/JsonLd";
import DateRangePicker from "@/components/react/components/DateRangePicker";
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
      <DateRangePicker />
    </>
  );
}
