import JsonToExcelPage from "@/components/tools/json-tools/JsonToExcelPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "JSON to Excel",
  description:
    "Convert JSON data to Excel (XLSX) spreadsheets. Free online JSON to Excel converter by Nayan UI.",
  path: "/tools/json-to-excel",
  keywords:
    "json to excel, convert json to excel, json to xlsx, json to excel online, json excel converter, json to spreadsheet, json data to excel, export json to excel, json to workbook, free json to excel, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "JSON to Excel", url: `${SITE_URL}/tools/json-to-excel` },
  ]),
  buildTechArticleSchema({
    title: "JSON to Excel",
    description: "Convert JSON data to Excel (XLSX) spreadsheets.",
    url: `${SITE_URL}/tools/json-to-excel`,
    keywords: "json to excel, convert json to excel, json to xlsx, json excel converter",
  }),
];

export default function JsonToExcelRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <JsonToExcelPage />
    </>
  );
}
