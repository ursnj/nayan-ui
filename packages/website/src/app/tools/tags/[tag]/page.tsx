import { notFound, permanentRedirect } from 'next/navigation';
import { getMenuItemByTag } from '@/services/Utils';

export default async function TagAlias({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const item = getMenuItemByTag(tag, '/tools');
  if (!item) notFound();
  permanentRedirect(item.link);
}
