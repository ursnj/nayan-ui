import PdfInfoPage from "@/components/tools/pdf-tools/PdfInfoPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "PDF Info",
  description:
    "Check a PDF's page count, file size, version, encryption status, and word count instantly. Free online PDF info tool by Nayan UI.",
  path: "/tools/pdf-info",
  keywords:
    "pdf info, pdf stats, pdf page count, check pdf properties, pdf file analyzer, pdf version checker, is pdf encrypted, pdf word count, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "PDF Info", url: `${SITE_URL}/tools/pdf-info` },
  ]),
  buildTechArticleSchema({
    title: "PDF Info",
    description: "Check a PDF's page count, file size, version, encryption status, and word count instantly.",
    url: `${SITE_URL}/tools/pdf-info`,
    keywords: "pdf info, pdf stats, pdf page count, pdf file analyzer",
  }),
];

export default function PdfInfoRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <PdfInfoPage />
    </>
  );
}
