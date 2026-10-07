import CsvToXmlPage from "@/components/tools/xml-tools/CsvToXmlPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "CSV to XML",
  description:
    "Convert CSV spreadsheets to well-formed XML with configurable root and row element names. Free online CSV to XML converter by Nayan UI.",
  path: "/tools/csv-to-xml",
  keywords:
    "csv to xml, convert csv to xml, csv to xml online, csv xml converter, csv to xml converter free, export csv as xml, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "CSV to XML", url: `${SITE_URL}/tools/csv-to-xml` },
  ]),
  buildTechArticleSchema({
    title: "CSV to XML",
    description: "Convert CSV spreadsheets to well-formed XML with configurable tag names.",
    url: `${SITE_URL}/tools/csv-to-xml`,
    keywords: "csv to xml, convert csv to xml, csv xml converter",
  }),
];

export default function CsvToXmlRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <CsvToXmlPage />
    </>
  );
}
