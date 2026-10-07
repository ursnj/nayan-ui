import QrCodeGeneratorPage from "@/components/tools/dev-tools/QrCodeGeneratorPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "QR Code Generator",
  description: "Generate QR codes from text or URLs. Free online QR code generator by Nayan UI.",
  path: "/tools/qr-code-generator",
  keywords: "qr code generator, qr generator, create qr code, online qr code, qr code maker, url to qr code, free qr code generator, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "QR Code Generator", url: `${SITE_URL}/tools/qr-code-generator` },
  ]),
  buildTechArticleSchema({
    title: "QR Code Generator",
    description: "Generate QR codes from text or URLs.",
    url: `${SITE_URL}/tools/qr-code-generator`,
    keywords: "qr code generator, qr generator, create qr code, qr code maker",
  }),
];

export default function QrCodeGeneratorRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <QrCodeGeneratorPage />
    </>
  );
}
