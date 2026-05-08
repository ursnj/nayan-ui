import TagDetails from '@/tags/TagsDetails';

export const dynamic = 'force-dynamic';

export default async function RNTagDetailPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  return <TagDetails tag={tag} />;
}
