import ExcelToPdfPage from "@/components/tools/pdf-tools/ExcelToPdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Excel to PDF",
  description:
    "Convert Excel spreadsheets (XLS, XLSX) to PDF format. Free online Excel to PDF converter by Nayan UI.",
  path: "/tools/excel-to-pdf",
  keywords:
    "excel to pdf, xlsx to pdf, xls to pdf, convert excel to pdf, excel to pdf online, spreadsheet to pdf, microsoft excel to pdf, excel file to pdf, workbook to pdf, csv to pdf, office spreadsheet to pdf, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Excel to PDF", url: `${SITE_URL}/tools/excel-to-pdf` },
  ]),
  buildTechArticleSchema({
    title: "Excel to PDF",
    description: "Convert Excel spreadsheets (XLS, XLSX) to PDF format.",
    url: `${SITE_URL}/tools/excel-to-pdf`,
    keywords: "excel to pdf, xlsx to pdf, xls to pdf, spreadsheet to pdf, office to pdf",
  }),
];

export default function ExcelToPdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <ExcelToPdfPage />
    </>
  );
}
