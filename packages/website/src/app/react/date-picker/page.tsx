import JsonLd from "@/components/helpers/JsonLd";
import DatePicker from "@/components/react/components/DatePicker";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/date-picker", "react");
export const metadata = pageMetadata;

export default function DatePickerPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <DatePicker />
    </>
  );
}
