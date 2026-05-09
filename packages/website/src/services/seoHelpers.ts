import { getMenuItem } from '@/services/Utils';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export function buildComponentPageSeo(path: string, platform: 'react' | 'react-native') {
  const item = getMenuItem(path);
  const title = item?.title || 'Component';
  const description = item?.description || `${title} component documentation and examples for Nayan UI.`;
  const platformLabel = platform === 'react' ? 'React' : 'React Native';
  const keywords = (item as any)?.tags?.map((t: any) => t.title || t.name || t.sku).join(', ') || '';

  const metadata = buildPageMetadata({
    title: `${title} - ${platformLabel} Component`,
    description: description.substring(0, 160),
    path,
    keywords: `${title}, ${platformLabel} ${title}, ${keywords}, Nayan UI, React Component Library`
  });

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: `${platformLabel} Components`, url: `${SITE_URL}/${platform}/components` },
    { name: title, url: `${SITE_URL}${path}` }
  ]);

  const techArticle = buildTechArticleSchema({
    title: `${title} - ${platformLabel} Component`,
    description,
    url: `${SITE_URL}${path}`,
    keywords: `${title}, ${platformLabel}, Nayan UI`
  });

  return { metadata, schemas: [breadcrumb, techArticle] };
}
