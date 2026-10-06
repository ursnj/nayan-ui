import MarkdownToPdfPage from "@/components/tools/pdf-tools/MarkdownToPdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Markdown to PDF",
  description:
    "Convert Markdown content to PDF documents. Free online Markdown to PDF converter by Nayan UI.",
  path: "/tools/markdown-to-pdf",
  keywords:
    "markdown to pdf, md to pdf, convert markdown to pdf, markdown to pdf online, free markdown to pdf, md to pdf converter, markdown pdf converter, export markdown as pdf, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Markdown to PDF", url: `${SITE_URL}/tools/markdown-to-pdf` },
  ]),
  buildTechArticleSchema({
    title: "Markdown to PDF",
    description: "Convert Markdown content to PDF documents.",
    url: `${SITE_URL}/tools/markdown-to-pdf`,
    keywords: "markdown to pdf, md to pdf, convert markdown to pdf, markdown pdf converter",
  }),
];

export default function MarkdownToPdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <MarkdownToPdfPage />
    </>
  );
}
