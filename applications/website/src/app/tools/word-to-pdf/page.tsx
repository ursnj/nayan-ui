import WordToPdfPage from "@/components/tools/pdf-tools/WordToPdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Word to PDF",
  description:
    "Convert Word documents (DOC, DOCX) to PDF format. Free online Word to PDF converter by Nayan UI.",
  path: "/tools/word-to-pdf",
  keywords:
    "word to pdf, docx to pdf, doc to pdf, convert word to pdf, word to pdf online, free word to pdf, word document to pdf, microsoft word to pdf, office to pdf, word file to pdf, docx converter, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Word to PDF", url: `${SITE_URL}/tools/word-to-pdf` },
  ]),
  buildTechArticleSchema({
    title: "Word to PDF",
    description: "Convert Word documents (DOC, DOCX) to PDF format.",
    url: `${SITE_URL}/tools/word-to-pdf`,
    keywords: "word to pdf, docx to pdf, doc to pdf, word document to pdf, office to pdf",
  }),
];

export default function WordToPdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <WordToPdfPage />
    </>
  );
}
