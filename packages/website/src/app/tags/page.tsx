import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from "@/services/seo";
import Tags from "@/components/tags/Tags";
export const metadata = buildPageMetadata({
  title: "Component and Module Tags",
  description: "Browse React and React Native components and Nayan Engine modules by topic.",
  path: "/tags",
  keywords: "nayan ui tags, react components, react native components, engine modules, component topics",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Tags", url: `${SITE_URL}/tags` },
  ]),
];

export default function TagsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Tags />
    </>
  );
}
