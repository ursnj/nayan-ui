import MarkdownPreviewPage from "@/components/tools/text-tools/MarkdownPreviewPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Markdown Preview",
  description:
    "Write markdown and see a live HTML preview side by side. Free online markdown editor and previewer by Nayan UI.",
  path: "/tools/markdown-preview",
  keywords:
    "markdown preview, markdown editor, markdown to html, live markdown preview, markdown viewer, online markdown editor, markdown renderer, md preview, readme editor, markdown syntax highlighter, github markdown preview, free markdown editor, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Markdown Preview", url: `${SITE_URL}/tools/markdown-preview` },
  ]),
  buildTechArticleSchema({
    title: "Markdown Preview",
    description: "Write markdown and see a live HTML preview side by side.",
    url: `${SITE_URL}/tools/markdown-preview`,
    keywords: "markdown preview, markdown editor, markdown to html, live preview, md editor",
  }),
];

export default function MarkdownPreviewRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <MarkdownPreviewPage />
    </>
  );
}
