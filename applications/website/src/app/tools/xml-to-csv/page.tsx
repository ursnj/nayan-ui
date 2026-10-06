import XmlToCsvPage from "@/components/tools/xml-tools/XmlToCsvPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "XML to CSV",
  description:
    "Convert XML records to CSV format for spreadsheets. Free online XML to CSV converter by Nayan UI.",
  path: "/tools/xml-to-csv",
  keywords:
    "xml to csv, convert xml to csv, xml to csv online, xml csv converter, xml to spreadsheet, xml records to csv, export xml as csv, free xml to csv, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "XML to CSV", url: `${SITE_URL}/tools/xml-to-csv` },
  ]),
  buildTechArticleSchema({
    title: "XML to CSV",
    description: "Convert XML records to CSV format for spreadsheets.",
    url: `${SITE_URL}/tools/xml-to-csv`,
    keywords: "xml to csv, convert xml to csv, xml csv converter, xml to spreadsheet",
  }),
];

export default function XmlToCsvRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <XmlToCsvPage />
    </>
  );
}
