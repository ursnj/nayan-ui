import CropPdfPage from "@/components/tools/pdf-tools/CropPdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Crop PDF",
  description:
    "Crop margins and trim PDF page borders. Free online PDF cropper by Nayan UI.",
  path: "/tools/crop-pdf",
  keywords:
    "crop pdf, trim pdf margins, resize pdf pages, pdf margin cutter, pdf page cropper, cut pdf borders, pdf trim tool, remove pdf margins, pdf whitespace remover, adjust pdf page size, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Crop PDF", url: `${SITE_URL}/tools/crop-pdf` },
  ]),
  buildTechArticleSchema({
    title: "Crop PDF",
    description: "Crop margins and trim PDF page borders.",
    url: `${SITE_URL}/tools/crop-pdf`,
    keywords: "crop pdf, trim pdf margins, pdf cropper, cut pdf borders, pdf trim",
  }),
];

export default function CropPdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <CropPdfPage />
    </>
  );
}
