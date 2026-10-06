import PdfToImagePage from "@/components/tools/pdf-tools/PdfToImagePage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "PDF to Image",
  description:
    "Extract PDF pages as individual image files. Free online PDF to image converter by Nayan UI.",
  path: "/tools/pdf-to-image",
  keywords:
    "pdf to image, pdf to jpg, pdf to png, convert pdf to image, pdf to image online, extract images from pdf, pdf page to image, pdf screenshot, pdf to picture, free pdf to image, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "PDF to Image", url: `${SITE_URL}/tools/pdf-to-image` },
  ]),
  buildTechArticleSchema({
    title: "PDF to Image",
    description: "Extract PDF pages as individual image files.",
    url: `${SITE_URL}/tools/pdf-to-image`,
    keywords: "pdf to image, pdf to jpg, pdf to png, extract images from pdf, pdf to picture",
  }),
];

export default function PdfToImageRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <PdfToImagePage />
    </>
  );
}
