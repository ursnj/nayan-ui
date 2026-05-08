import TagDetails from '@/tags/TagsDetails';

export default async function TagDetailPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  return <TagDetails tag={tag} />;
}
