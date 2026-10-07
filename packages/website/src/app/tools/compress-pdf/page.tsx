import CompressPdfPage from "@/components/tools/pdf-tools/CompressPdfPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Compress PDF",
  description:
    "Reduce PDF file size while preserving content quality. Free online PDF compressor by Nayan UI.",
  path: "/tools/compress-pdf",
  keywords:
    "compress pdf, pdf compressor, reduce pdf size, shrink pdf, compress pdf online, free pdf compressor, pdf optimizer, make pdf smaller, reduce pdf file size, pdf size reducer, optimize pdf, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Compress PDF", url: `${SITE_URL}/tools/compress-pdf` },
  ]),
  buildTechArticleSchema({
    title: "Compress PDF",
    description: "Reduce PDF file size while preserving content quality.",
    url: `${SITE_URL}/tools/compress-pdf`,
    keywords: "compress pdf, pdf compressor, reduce pdf size, shrink pdf, pdf optimizer",
  }),
];

export default function CompressPdfRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <CompressPdfPage />
    </>
  );
}
