import PdfToExcelPage from "@/components/tools/pdf-tools/PdfToExcelPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "PDF to Excel",
  description:
    "Convert PDF files to Excel (XLSX) spreadsheets. Free online PDF to Excel converter by Nayan UI.",
  path: "/tools/pdf-to-excel",
  keywords:
    "pdf to excel, pdf to xlsx, convert pdf to excel, pdf to excel online, free pdf to excel, pdf to spreadsheet, pdf table to excel, extract data from pdf, pdf to xls, pdf to workbook, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "PDF to Excel", url: `${SITE_URL}/tools/pdf-to-excel` },
  ]),
  buildTechArticleSchema({
    title: "PDF to Excel",
    description: "Convert PDF files to Excel (XLSX) spreadsheets.",
    url: `${SITE_URL}/tools/pdf-to-excel`,
    keywords: "pdf to excel, pdf to xlsx, convert pdf to excel, pdf to spreadsheet, pdf to xls",
  }),
];

export default function PdfToExcelRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <PdfToExcelPage />
    </>
  );
}
