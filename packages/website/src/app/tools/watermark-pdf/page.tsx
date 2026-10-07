import WatermarkPdfPage from "@/components/tools/pdf-tools/WatermarkPdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Watermark PDF",
  description:
    "Add text watermarks to every page of a PDF document. Free online PDF watermark tool by Nayan UI.",
  path: "/tools/watermark-pdf",
  keywords:
    "watermark pdf, pdf watermark, add watermark pdf, stamp pdf, watermark pdf online, free pdf watermark, text watermark pdf, pdf branding, add text to pdf, overlay text pdf, pdf stamp tool, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Watermark PDF", url: `${SITE_URL}/tools/watermark-pdf` },
  ]),
  buildTechArticleSchema({
    title: "Watermark PDF",
    description: "Add text watermarks to every page of a PDF document.",
    url: `${SITE_URL}/tools/watermark-pdf`,
    keywords: "watermark pdf, pdf watermark, add watermark, stamp pdf, text overlay pdf",
  }),
];

export default function WatermarkPdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <WatermarkPdfPage />
    </>
  );
}
