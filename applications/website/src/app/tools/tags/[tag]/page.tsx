import type { Metadata } from "next";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from "@/services/seo";
import TagDetails from "@/components/tags/TagsDetails";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const title = tag.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return buildPageMetadata({
    title: `${title} - Developer Tools Tag`,
    description: `Browse Nayan UI developer tools tagged with "${title}". Find related tools, documentation, and CLI utilities.`,
    path: `/tools/tags/${tag}`,
    keywords: `${title}, tools, nayan ui, developer tools, cli utilities`,
  });
}

export default async function DevtoolsTagDetailPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const title = tag.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const schemas = [
    buildBreadcrumbSchema([
      { name: "Home", url: SITE_URL },
      { name: "Developer Tools", url: `${SITE_URL}/tools` },
      { name: "Tags", url: `${SITE_URL}/tools/tags` },
      { name: title, url: `${SITE_URL}/tools/tags/${tag}` },
    ]),
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <TagDetails tag={tag} />
    </>
  );
}
