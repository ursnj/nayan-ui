import PdfToMarkdownPage from "@/components/tools/pdf-tools/PdfToMarkdownPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "PDF to Markdown",
  description:
    "Convert PDF files to Markdown (.md) documents. Free online PDF to Markdown converter by Nayan UI.",
  path: "/tools/pdf-to-markdown",
  keywords:
    "pdf to markdown, pdf to md, convert pdf to markdown, pdf to markdown online, free pdf to markdown, pdf markdown converter, extract markdown from pdf, pdf to md converter, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "PDF to Markdown", url: `${SITE_URL}/tools/pdf-to-markdown` },
  ]),
  buildTechArticleSchema({
    title: "PDF to Markdown",
    description: "Convert PDF files to Markdown (.md) documents.",
    url: `${SITE_URL}/tools/pdf-to-markdown`,
    keywords: "pdf to markdown, pdf to md, convert pdf to markdown, pdf markdown converter",
  }),
];

export default function PdfToMarkdownRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <PdfToMarkdownPage />
    </>
  );
}
