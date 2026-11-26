import { ReferenceIndex, referenceGroups } from '@/components/reference/ReferencePage';
import { buildPageMetadata } from '@/services/seo';

export const metadata = buildPageMetadata({
  title: referenceGroups.components.title,
  description: referenceGroups.components.description,
  path: '/components'
});

export default function ComponentsPage() {
  return <ReferenceIndex group="components" />;
}
