import { ReferencePage } from '@/components/engine/reference/ReferencePage';
import { moduleReferences } from '@/services/engine/module-reference';
import { buildPageMetadata } from '@/services/seo';

const entry = moduleReferences.find(({ slug }) => slug === 'games')!;

export const metadata = buildPageMetadata({ title: entry.title, description: entry.description, path: entry.path });

export default function GameRuntimeReferencePage() {
  return <ReferencePage entry={entry} />;
}
