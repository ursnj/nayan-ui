import JsonLd from "@/components/helpers/JsonLd";
import Components from "@/components/react/components/Components";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "React Components",
  description:
    "Explore Nayan UI components for React, including themed controls, layouts, forms and feedback.",
  path: "/react",
  keywords: "react components, nayan ui, ui library, react themes, accessible controls",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "React", url: `${SITE_URL}/react` },
  ]),
];

export default function ReactPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Components />
    </>
  );
}
