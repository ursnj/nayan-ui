import SplitPdfPage from "@/components/tools/pdf-tools/SplitPdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Split PDF",
  description:
    "Split PDF files by page ranges. Extract specific pages into separate documents. Free online PDF splitter by Nayan UI.",
  path: "/tools/split-pdf",
  keywords:
    "split pdf, pdf splitter, extract pdf pages, separate pdf, split pdf online, free pdf splitter, pdf page extractor, split pdf by pages, divide pdf, pdf cutter, extract pages from pdf, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Split PDF", url: `${SITE_URL}/tools/split-pdf` },
  ]),
  buildTechArticleSchema({
    title: "Split PDF",
    description: "Split PDF files by page ranges into separate documents.",
    url: `${SITE_URL}/tools/split-pdf`,
    keywords: "split pdf, pdf splitter, extract pdf pages, separate pdf, pdf cutter",
  }),
];

export default function SplitPdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <SplitPdfPage />
    </>
  );
}
