import RepairPdfPage from "@/components/tools/pdf-tools/RepairPdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Repair PDF",
  description:
    "Fix and recover corrupted or damaged PDF files. Free online PDF repair tool by Nayan UI.",
  path: "/tools/repair-pdf",
  keywords:
    "repair pdf, fix pdf, recover pdf, fix corrupted pdf, pdf recovery tool, broken pdf fixer, damaged pdf repair, restore pdf, pdf fix online, corrupted pdf recovery, free pdf repair tool, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Repair PDF", url: `${SITE_URL}/tools/repair-pdf` },
  ]),
  buildTechArticleSchema({
    title: "Repair PDF",
    description: "Fix and recover corrupted or damaged PDF files.",
    url: `${SITE_URL}/tools/repair-pdf`,
    keywords: "repair pdf, fix pdf, recover corrupted pdf, pdf recovery, broken pdf fixer",
  }),
];

export default function RepairPdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <RepairPdfPage />
    </>
  );
}
