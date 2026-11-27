import SerpSnippetPreviewPage from '@/components/tools/seo-tools/SerpSnippetPreviewPage';
import JsonLd from '@/components/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export const metadata = buildPageMetadata({
  title: 'Google SERP Snippet Preview',
  description: 'Learn how to write clear title tags and meta descriptions for search results.',
  path: '/tools/serp-snippet-preview',
  keywords:
    'serp snippet preview, google search preview, serp preview tool, meta title preview, meta description preview, search result preview, google snippet generator, title tag length checker, free serp tool, nayan ui tools'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Developer Tools', url: `${SITE_URL}/tools` },
    { name: 'Google SERP Snippet Preview', url: `${SITE_URL}/tools/serp-snippet-preview` }
  ]),
  buildTechArticleSchema({
    title: 'Google SERP Snippet Preview',
    description: 'Learn how to write clear title tags and meta descriptions for search results.',
    url: `${SITE_URL}/tools/serp-snippet-preview`,
    keywords: 'serp snippet preview, google search preview, meta title, meta description'
  })
];

export default function SerpSnippetPreviewRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <SerpSnippetPreviewPage />
    </>
  );
}
