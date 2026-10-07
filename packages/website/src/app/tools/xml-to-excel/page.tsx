import XmlToExcelPage from "@/components/tools/xml-tools/XmlToExcelPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "XML to Excel",
  description:
    "Convert XML data to Excel (XLSX) spreadsheets. Free online XML to Excel converter by Nayan UI.",
  path: "/tools/xml-to-excel",
  keywords:
    "xml to excel, convert xml to excel, xml to xlsx, xml to excel online, xml excel converter, xml to spreadsheet, free xml to excel, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "XML to Excel", url: `${SITE_URL}/tools/xml-to-excel` },
  ]),
  buildTechArticleSchema({
    title: "XML to Excel",
    description: "Convert XML data to Excel (XLSX) spreadsheets.",
    url: `${SITE_URL}/tools/xml-to-excel`,
    keywords: "xml to excel, convert xml to excel, xml to xlsx, xml excel converter",
  }),
];

export default function XmlToExcelRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <XmlToExcelPage />
    </>
  );
}
