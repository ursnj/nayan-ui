import OpenGraphPreviewPage from '@/components/tools/seo-tools/OpenGraphPreviewPage';
import JsonLd from '@/components/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export const metadata = buildPageMetadata({
  title: 'Open Graph Preview',
  description: 'Learn how to review Open Graph and social card metadata before sharing a page.',
  path: '/tools/open-graph-preview',
  keywords:
    'open graph preview, og preview, social media preview, facebook preview, twitter preview, linkedin preview, slack preview, google search preview, og image preview, social share preview, free og preview, nayan ui tools'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Developer Tools', url: `${SITE_URL}/tools` },
    { name: 'Open Graph Preview', url: `${SITE_URL}/tools/open-graph-preview` }
  ]),
  buildTechArticleSchema({
    title: 'Open Graph Preview',
    description: 'Learn how to review Open Graph and social card metadata before sharing a page.',
    url: `${SITE_URL}/tools/open-graph-preview`,
    keywords: 'open graph preview, social media preview, og preview, facebook twitter'
  })
];

export default function OpenGraphPreviewRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <OpenGraphPreviewPage />
    </>
  );
}
