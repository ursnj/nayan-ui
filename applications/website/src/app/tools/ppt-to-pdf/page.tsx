import PptToPdfPage from "@/components/tools/pdf-tools/PptToPdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "PowerPoint to PDF",
  description:
    "Convert PowerPoint presentations (PPT, PPTX) to PDF format. Free online PowerPoint to PDF converter by Nayan UI.",
  path: "/tools/ppt-to-pdf",
  keywords:
    "ppt to pdf, pptx to pdf, convert powerpoint to pdf, powerpoint to pdf online, presentation to pdf, microsoft powerpoint to pdf, slides to pdf, ppt file to pdf, office presentation to pdf, free ppt to pdf, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "PowerPoint to PDF", url: `${SITE_URL}/tools/ppt-to-pdf` },
  ]),
  buildTechArticleSchema({
    title: "PowerPoint to PDF",
    description: "Convert PowerPoint presentations (PPT, PPTX) to PDF format.",
    url: `${SITE_URL}/tools/ppt-to-pdf`,
    keywords: "ppt to pdf, pptx to pdf, powerpoint to pdf, presentation to pdf, slides to pdf",
  }),
];

export default function PptToPdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <PptToPdfPage />
    </>
  );
}
