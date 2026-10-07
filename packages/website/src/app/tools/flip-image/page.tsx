import FlipImagePage from "@/components/tools/image-tools/FlipImagePage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Flip Image",
  description:
    "Flip JPG, PNG, or WebP images horizontally or vertically instantly in your browser. Free online image flipper by Nayan UI.",
  path: "/tools/flip-image",
  keywords:
    "flip image, mirror image, flip image horizontal, flip image vertical, image mirror tool, flip photo online, flip jpg, flip png, free image flipper, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Flip Image", url: `${SITE_URL}/tools/flip-image` },
  ]),
  buildTechArticleSchema({
    title: "Flip Image",
    description: "Flip images horizontally or vertically instantly in your browser.",
    url: `${SITE_URL}/tools/flip-image`,
    keywords: "flip image, mirror image, flip horizontal, flip vertical",
  }),
];

export default function FlipImageRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <FlipImagePage />
    </>
  );
}
