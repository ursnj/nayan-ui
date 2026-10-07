import JsonToCsvPage from "@/components/tools/json-tools/JsonToCsvPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "JSON to CSV",
  description:
    "Convert JSON arrays to CSV format for spreadsheets. Free online JSON to CSV converter by Nayan UI.",
  path: "/tools/json-to-csv",
  keywords:
    "json to csv, convert json to csv, json to csv online, json csv converter, json to spreadsheet, json array to csv, export json to csv, json data to csv, json table to csv, free json to csv, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "JSON to CSV", url: `${SITE_URL}/tools/json-to-csv` },
  ]),
  buildTechArticleSchema({
    title: "JSON to CSV",
    description: "Convert JSON arrays to CSV format for spreadsheets.",
    url: `${SITE_URL}/tools/json-to-csv`,
    keywords: "json to csv, convert json to csv, json csv converter, json to spreadsheet",
  }),
];

export default function JsonToCsvRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <JsonToCsvPage />
    </>
  );
}
