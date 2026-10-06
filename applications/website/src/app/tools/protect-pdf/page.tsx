import ProtectPdfPage from "@/components/tools/pdf-tools/ProtectPdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Protect PDF",
  description:
    "Secure PDF files with password protection. Free online PDF protection tool by Nayan UI.",
  path: "/tools/protect-pdf",
  keywords:
    "protect pdf, encrypt pdf, password protect pdf, lock pdf, secure pdf, protect pdf online, pdf encryption, add password to pdf, pdf security, pdf access control, aes 256 pdf encryption, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Protect PDF", url: `${SITE_URL}/tools/protect-pdf` },
  ]),
  buildTechArticleSchema({
    title: "Protect PDF",
    description: "Secure PDF files with password protection.",
    url: `${SITE_URL}/tools/protect-pdf`,
    keywords: "protect pdf, encrypt pdf, password protect pdf, lock pdf, pdf security",
  }),
];

export default function ProtectPdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <ProtectPdfPage />
    </>
  );
}
