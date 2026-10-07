import SignPdfPage from "@/components/tools/pdf-tools/SignPdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Sign PDF",
  description:
    "Draw your signature and stamp it onto any page of a PDF, then download the signed file. Free online PDF signing tool by Nayan UI.",
  path: "/tools/sign-pdf",
  keywords:
    "sign pdf, pdf signature, esign pdf, draw signature online, add signature to pdf, free pdf signer, electronic signature pdf, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Sign PDF", url: `${SITE_URL}/tools/sign-pdf` },
  ]),
  buildTechArticleSchema({
    title: "Sign PDF",
    description: "Draw your signature and stamp it onto any page of a PDF, then download the signed file.",
    url: `${SITE_URL}/tools/sign-pdf`,
    keywords: "sign pdf, pdf signature, esign pdf, add signature to pdf",
  }),
];

export default function SignPdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <SignPdfPage />
    </>
  );
}
