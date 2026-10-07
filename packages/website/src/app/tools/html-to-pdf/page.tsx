import HtmlToPdfPage from "@/components/tools/pdf-tools/HtmlToPdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "HTML to PDF",
  description:
    "Convert HTML content to PDF documents. Free online HTML to PDF converter by Nayan UI.",
  path: "/tools/html-to-pdf",
  keywords:
    "html to pdf, convert html to pdf, html to pdf online, text to pdf, html pdf converter, webpage to pdf, html code to pdf, web page to pdf, save html as pdf, html document to pdf, free html to pdf, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "HTML to PDF", url: `${SITE_URL}/tools/html-to-pdf` },
  ]),
  buildTechArticleSchema({
    title: "HTML to PDF",
    description: "Convert HTML content to PDF documents.",
    url: `${SITE_URL}/tools/html-to-pdf`,
    keywords: "html to pdf, convert html to pdf, webpage to pdf, html pdf converter, web to pdf",
  }),
];

export default function HtmlToPdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <HtmlToPdfPage />
    </>
  );
}
