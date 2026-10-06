import OrganizePdfPage from "@/components/tools/pdf-tools/OrganizePdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Organize PDF",
  description:
    "Reorder, delete, and rearrange PDF pages. Free online PDF page organizer by Nayan UI.",
  path: "/tools/organize-pdf",
  keywords:
    "organize pdf, reorder pdf pages, delete pdf pages, rearrange pdf, pdf page organizer, sort pdf pages, move pdf pages, remove pages from pdf, pdf page manager, drag and drop pdf, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Organize PDF", url: `${SITE_URL}/tools/organize-pdf` },
  ]),
  buildTechArticleSchema({
    title: "Organize PDF",
    description: "Reorder, delete, and rearrange PDF pages.",
    url: `${SITE_URL}/tools/organize-pdf`,
    keywords: "organize pdf, reorder pdf pages, delete pdf pages, rearrange pdf, pdf manager",
  }),
];

export default function OrganizePdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <OrganizePdfPage />
    </>
  );
}
