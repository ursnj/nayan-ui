import MergePdfPage from "@/components/tools/pdf-tools/MergePdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Merge PDF",
  description:
    "Combine multiple PDF files into a single document. Free online PDF merger by Nayan UI.",
  path: "/tools/merge-pdf",
  keywords:
    "merge pdf, combine pdf, join pdf, pdf merger, merge pdf online, free pdf merger, concatenate pdf, merge multiple pdfs, pdf combiner, merge pdf files free, combine pdf pages, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Merge PDF", url: `${SITE_URL}/tools/merge-pdf` },
  ]),
  buildTechArticleSchema({
    title: "Merge PDF",
    description: "Combine multiple PDF files into a single document.",
    url: `${SITE_URL}/tools/merge-pdf`,
    keywords: "merge pdf, combine pdf, join pdf, pdf merger, concatenate pdf",
  }),
];

export default function MergePdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <MergePdfPage />
    </>
  );
}
