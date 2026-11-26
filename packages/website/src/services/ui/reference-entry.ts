import { buildPageMetadata } from '@/services/seo';
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
    keywords: tagsForReference(entry.path).map(({ text }) => text).join(', ')
  });
}
