import { notFound } from 'next/navigation';
import { ReferencePage } from '@/components/nayan-reference/ReferencePage';
import { moduleEntries, referenceEntryMetadata } from '@/services/nayan-ui/reference-entry';

export const dynamicParams = false;

type Props = { params: Promise<{ entry: string }> };

export function generateStaticParams() {
  return moduleEntries.map(({ slug }) => ({ entry: slug }));
}

async function getEntry({ params }: Props) {
  const { entry } = await params;
  return moduleEntries.find(({ slug }) => slug === entry) ?? notFound();
}

export async function generateMetadata(props: Props) {
  return referenceEntryMetadata(await getEntry(props));
}

export default async function EngineReferenceEntryPage(props: Props) {
  return <ReferencePage entry={await getEntry(props)} />;
}
