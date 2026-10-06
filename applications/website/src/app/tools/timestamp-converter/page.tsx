import TimestampConverterPage from "@/components/tools/dev-tools/TimestampConverterPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Timestamp Converter",
  description: "Convert Unix timestamps to dates and vice versa. Free online timestamp converter by Nayan UI.",
  path: "/tools/timestamp-converter",
  keywords: "timestamp converter, unix timestamp converter, epoch converter, date to timestamp, timestamp to date, online timestamp tool, free timestamp converter, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Timestamp Converter", url: `${SITE_URL}/tools/timestamp-converter` },
  ]),
  buildTechArticleSchema({
    title: "Timestamp Converter",
    description: "Convert Unix timestamps to dates and vice versa.",
    url: `${SITE_URL}/tools/timestamp-converter`,
    keywords: "timestamp converter, unix timestamp, epoch converter, date converter",
  }),
];

export default function TimestampConverterRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <TimestampConverterPage />
    </>
  );
}
