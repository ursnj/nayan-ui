import SerpSnippetPreviewPage from "@/components/tools/seo-tools/SerpSnippetPreviewPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Google SERP Snippet Preview",
  description:
    "Preview how your page title and meta description will look in Google search results, with live character-limit truncation. Free online SERP preview tool by Nayan UI.",
  path: "/tools/serp-snippet-preview",
  keywords:
    "serp snippet preview, google search preview, serp preview tool, meta title preview, meta description preview, search result preview, google snippet generator, title tag length checker, free serp tool, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Google SERP Snippet Preview", url: `${SITE_URL}/tools/serp-snippet-preview` },
  ]),
  buildTechArticleSchema({
    title: "Google SERP Snippet Preview",
    description: "Preview how your page title and meta description will look in Google search results.",
    url: `${SITE_URL}/tools/serp-snippet-preview`,
    keywords: "serp snippet preview, google search preview, meta title, meta description",
  }),
];

export default function SerpSnippetPreviewRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <SerpSnippetPreviewPage />
    </>
  );
}
