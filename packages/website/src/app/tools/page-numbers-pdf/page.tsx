import PageNumbersPdfPage from "@/components/tools/pdf-tools/PageNumbersPdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "PDF Page Numbers",
  description:
    "Add page numbers to PDF documents with custom formatting and positioning. Free online tool by Nayan UI.",
  path: "/tools/page-numbers-pdf",
  keywords:
    "pdf page numbers, add page numbers pdf, number pdf pages, pdf page numbering, pdf footer, pdf header numbers, page numbering tool, insert page numbers pdf, pdf pagination, free page number pdf, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "PDF Page Numbers", url: `${SITE_URL}/tools/page-numbers-pdf` },
  ]),
  buildTechArticleSchema({
    title: "PDF Page Numbers",
    description: "Add page numbers to PDF documents with custom formatting and positioning.",
    url: `${SITE_URL}/tools/page-numbers-pdf`,
    keywords: "pdf page numbers, add page numbers, pdf numbering, pdf footer, pdf pagination",
  }),
];

export default function PageNumbersPdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <PageNumbersPdfPage />
    </>
  );
}
