import { notFound } from 'next/navigation';
import { ReferencePage } from '@/components/nayan-reference/ReferencePage';
import { componentReferences } from '@/services/nayan-ui/component-reference';
import { moduleReferences } from '@/services/nayan-ui/module-reference';
import { tagsForReference } from '@/services/nayan-ui/reference-tags';
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
  return buildPageMetadata({
    title: `${entry.title} · Engine Reference`,
    description: entry.description,
    path: entry.path,
    keywords: tagsForReference(entry.path).map(({ text }) => text).join(', ')
  });
}

export default async function EngineReferenceEntryPage(props: Props) {
  return <ReferencePage entry={await getEntry(props)} />;
}
