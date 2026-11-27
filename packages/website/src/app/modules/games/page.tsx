import { ReferencePage } from '@/components/reference/ReferencePage';
import { moduleReferences } from '@/services/ui/module-reference';
import { tagsForReference } from '@/services/ui/reference-tags';
import { buildPageMetadata } from '@/services/seo';

const entry = moduleReferences.find(({ slug }) => slug === 'games')!;

export const metadata = buildPageMetadata({
  title: entry.title,
  description: entry.description,
  path: entry.path,
  keywords: tagsForReference(entry.path).map(({ text }) => text).join(', ')
});

export default function GameRuntimeReferencePage() {
  return <ReferencePage entry={entry} />;
}
