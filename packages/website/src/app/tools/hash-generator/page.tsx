import HashGeneratorPage from "@/components/tools/text-tools/HashGeneratorPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Hash Generator",
  description: "Generate SHA-1, SHA-256, SHA-384, and SHA-512 hashes from text. Free online hash tool by Nayan UI.",
  path: "/tools/hash-generator",
  keywords: "hash generator, sha256 hash, sha512 hash, sha1 hash, online hash tool, text hash generator, crypto hash, free hash generator, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Hash Generator", url: `${SITE_URL}/tools/hash-generator` },
  ]),
  buildTechArticleSchema({
    title: "Hash Generator",
    description: "Generate SHA-1, SHA-256, SHA-384, and SHA-512 hashes from text.",
    url: `${SITE_URL}/tools/hash-generator`,
    keywords: "hash generator, sha256, sha512, crypto hash, checksum",
  }),
];

export default function HashGeneratorRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <HashGeneratorPage />
    </>
  );
}
