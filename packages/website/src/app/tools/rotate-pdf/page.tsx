import RotatePdfPage from "@/components/tools/pdf-tools/RotatePdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Rotate PDF",
  description:
    "Rotate PDF pages by 90°, 180°, or 270°. Free online PDF rotator by Nayan UI.",
  path: "/tools/rotate-pdf",
  keywords:
    "rotate pdf, pdf rotator, rotate pdf pages, rotate pdf online, free pdf rotator, rotate pdf 90 degrees, flip pdf, turn pdf sideways, pdf page rotation, rotate pdf pages free, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Rotate PDF", url: `${SITE_URL}/tools/rotate-pdf` },
  ]),
  buildTechArticleSchema({
    title: "Rotate PDF",
    description: "Rotate PDF pages by 90°, 180°, or 270°.",
    url: `${SITE_URL}/tools/rotate-pdf`,
    keywords: "rotate pdf, pdf rotator, rotate pdf pages, flip pdf, pdf rotation",
  }),
];

export default function RotatePdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <RotatePdfPage />
    </>
  );
}
