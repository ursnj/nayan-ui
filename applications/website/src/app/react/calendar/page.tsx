import JsonLd from "@/components/helpers/JsonLd";
import Calendar from "@/components/react/components/Calendar";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo("/react/calendar", "react");
export const metadata = pageMetadata;

export default function CalendarPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Calendar />
    </>
  );
}
