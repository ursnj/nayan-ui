import { notFound } from 'next/navigation';
import { ReferencePage } from '@/components/engine/reference/ReferencePage';
import { componentReferences } from '@/services/engine/component-reference';
import { moduleReferences } from '@/services/engine/module-reference';
import { buildPageMetadata } from '@/services/seo';

const entries = [...componentReferences, ...moduleReferences].filter(({ path }) => path.split('/').length === 2);

export const dynamicParams = false;

type Props = { params: Promise<{ entry: string }> };

export function generateStaticParams() {
  return entries.map(({ slug }) => ({ entry: slug }));
}

async function getEntry({ params }: Props) {
  const { entry } = await params;
  return entries.find(({ slug }) => slug === entry) ?? notFound();
}

export async function generateMetadata(props: Props) {
  const entry = await getEntry(props);
  return buildPageMetadata({ title: `${entry.title} · Engine Reference`, description: entry.description, path: entry.path });
}

export default async function EngineReferenceEntryPage(props: Props) {
  return <ReferencePage entry={await getEntry(props)} />;
}
