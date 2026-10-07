import ExtractImagesFromPdfPage from "@/components/tools/pdf-tools/ExtractImagesFromPdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Extract Images from PDF",
  description:
    "Find and extract every embedded image from a PDF and download them all as a ZIP. Free online PDF image extractor by Nayan UI.",
  path: "/tools/extract-images-from-pdf",
  keywords:
    "extract images from pdf, pdf image extractor, get images from pdf, pull images out of pdf, pdf to images zip, free pdf image extractor, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Extract Images from PDF", url: `${SITE_URL}/tools/extract-images-from-pdf` },
  ]),
  buildTechArticleSchema({
    title: "Extract Images from PDF",
    description: "Find and extract every embedded image from a PDF and download them all as a ZIP.",
    url: `${SITE_URL}/tools/extract-images-from-pdf`,
    keywords: "extract images from pdf, pdf image extractor, get images from pdf",
  }),
];

export default function ExtractImagesFromPdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <ExtractImagesFromPdfPage />
    </>
  );
}
