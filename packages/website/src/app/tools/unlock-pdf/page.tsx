import UnlockPdfPage from "@/components/tools/pdf-tools/UnlockPdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Unlock PDF",
  description:
    "Remove password protection from PDF files. Decrypt and save unprotected copies. Free online PDF unlocker by Nayan UI.",
  path: "/tools/unlock-pdf",
  keywords:
    "unlock pdf, remove pdf password, decrypt pdf, pdf password remover, unlock pdf online, free pdf unlocker, pdf decryption, open locked pdf, remove pdf encryption, bypass pdf password, unsecure pdf, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Unlock PDF", url: `${SITE_URL}/tools/unlock-pdf` },
  ]),
  buildTechArticleSchema({
    title: "Unlock PDF",
    description: "Remove password protection from PDF files.",
    url: `${SITE_URL}/tools/unlock-pdf`,
    keywords: "unlock pdf, remove pdf password, decrypt pdf, pdf password remover, pdf decryption",
  }),
];

export default function UnlockPdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <UnlockPdfPage />
    </>
  );
}
