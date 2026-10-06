import PdfToWordPage from "@/components/tools/pdf-tools/PdfToWordPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "PDF to Word",
  description:
    "Convert PDF files to editable Word (DOCX) documents. Free online PDF to Word converter by Nayan UI.",
  path: "/tools/pdf-to-word",
  keywords:
    "pdf to word, pdf to docx, convert pdf to word, pdf to word online, free pdf to word, pdf to word converter, pdf to editable word, extract text from pdf, pdf to doc, pdf to microsoft word, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "PDF to Word", url: `${SITE_URL}/tools/pdf-to-word` },
  ]),
  buildTechArticleSchema({
    title: "PDF to Word",
    description: "Convert PDF files to editable Word (DOCX) documents.",
    url: `${SITE_URL}/tools/pdf-to-word`,
    keywords: "pdf to word, pdf to docx, convert pdf to word, pdf to editable word, pdf to doc",
  }),
];

export default function PdfToWordRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <PdfToWordPage />
    </>
  );
}
