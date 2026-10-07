import ImageToPdfPage from "@/components/tools/pdf-tools/ImageToPdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Image to PDF",
  description:
    "Convert JPG, PNG, and WebP images to PDF documents. Free online image to PDF converter by Nayan UI.",
  path: "/tools/image-to-pdf",
  keywords:
    "image to pdf, jpg to pdf, png to pdf, convert image to pdf, photo to pdf, image to pdf online, webp to pdf, picture to pdf, multiple images to pdf, batch image to pdf, free image to pdf converter, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Image to PDF", url: `${SITE_URL}/tools/image-to-pdf` },
  ]),
  buildTechArticleSchema({
    title: "Image to PDF",
    description: "Convert JPG, PNG, and WebP images to PDF documents.",
    url: `${SITE_URL}/tools/image-to-pdf`,
    keywords: "image to pdf, jpg to pdf, png to pdf, photo to pdf, picture to pdf",
  }),
];

export default function ImageToPdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <ImageToPdfPage />
    </>
  );
}
