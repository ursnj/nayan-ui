import { notFound } from 'next/navigation';
import { ReferencePage } from '@/components/reference/ReferencePage';
import { componentReferences } from '@/services/ui/component-reference';
import { referenceEntryMetadata } from '@/services/ui/reference-entry';

export const dynamicParams = false;

type Props = { params: Promise<{ entry: string }> };

export function generateStaticParams() {
  return componentReferences.map(({ slug }) => ({ entry: slug }));
}

async function getEntry({ params }: Props) {
  const { entry } = await params;
  return componentReferences.find(({ slug }) => slug === entry) ?? notFound();
}

export async function generateMetadata(props: Props) {
  return referenceEntryMetadata(await getEntry(props));
}

export default async function EngineReferenceEntryPage(props: Props) {
  return <ReferencePage entry={await getEntry(props)} />;
}
