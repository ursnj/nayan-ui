import PdfToPptPage from "@/components/tools/pdf-tools/PdfToPptPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "PDF to PowerPoint",
  description:
    "Convert PDF files to PowerPoint (PPTX) presentations. Free online PDF to PowerPoint converter by Nayan UI.",
  path: "/tools/pdf-to-ppt",
  keywords:
    "pdf to ppt, pdf to pptx, convert pdf to powerpoint, pdf to powerpoint online, free pdf to ppt, pdf to slides, pdf to presentation, pdf to microsoft powerpoint, extract slides from pdf, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "PDF to PowerPoint", url: `${SITE_URL}/tools/pdf-to-ppt` },
  ]),
  buildTechArticleSchema({
    title: "PDF to PowerPoint",
    description: "Convert PDF files to PowerPoint (PPTX) presentations.",
    url: `${SITE_URL}/tools/pdf-to-ppt`,
    keywords: "pdf to ppt, pdf to pptx, pdf to powerpoint, pdf to slides, pdf to presentation",
  }),
];

export default function PdfToPptRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <PdfToPptPage />
    </>
  );
}
