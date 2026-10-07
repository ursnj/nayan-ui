import CsvToJsonPage from "@/components/tools/json-tools/CsvToJsonPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "CSV to JSON",
  description: "Convert CSV data to JSON format with header detection. Free online CSV to JSON converter by Nayan UI.",
  path: "/tools/csv-to-json",
  keywords: "csv to json, csv json converter, convert csv to json, online csv to json, csv parser, csv to json tool, free csv to json, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "CSV to JSON", url: `${SITE_URL}/tools/csv-to-json` },
  ]),
  buildTechArticleSchema({
    title: "CSV to JSON",
    description: "Convert CSV data to JSON format with header detection.",
    url: `${SITE_URL}/tools/csv-to-json`,
    keywords: "csv to json, csv converter, csv parser, data conversion",
  }),
];

export default function CsvToJsonRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <CsvToJsonPage />
    </>
  );
}
