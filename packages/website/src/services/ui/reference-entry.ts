import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';
import { componentReferences } from './component-reference';
import { moduleReferences } from './module-reference';
import { tagsForReference } from './reference-tags';

type ComponentReference = (typeof componentReferences)[number];
type ModuleReference = (typeof moduleReferences)[number];

export const moduleEntries = moduleReferences.filter(({ slug }) => slug !== 'games');
export const referenceEntries = [...componentReferences, ...moduleEntries];

export function referenceEntryMetadata(entry: ComponentReference | ModuleReference) {
  return buildPageMetadata({
    title: `${entry.title} · Engine Reference`,
    description: entry.description,
    path: entry.path,
    keywords: tagsForReference(entry.path)
      .map(({ text }) => text)
      .join(', ')
  });
}

export function referenceEntrySchemas(entry: ComponentReference | ModuleReference) {
  const component = 'symbol' in entry;
  const group = component ? { name: 'Components', url: `${SITE_URL}/components` } : { name: 'Modules', url: `${SITE_URL}/modules` };
  const url = SITE_URL + entry.path;
  return [
    buildBreadcrumbSchema([{ name: 'Home', url: SITE_URL }, group, { name: entry.title, url }]),
    buildTechArticleSchema({
      title: entry.title,
      description: entry.description,
      url,
      about: { '@type': 'Thing', name: component ? entry.symbol : entry.importPath },
      isPartOf: group
    })
  ];
}
