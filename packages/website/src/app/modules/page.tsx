import { ReferenceIndex, referenceGroups } from '@/components/reference/ReferencePage';
import { buildPageMetadata } from '@/services/seo';

export const metadata = buildPageMetadata({
  title: referenceGroups.modules.title,
  description: referenceGroups.modules.description,
  path: '/modules'
});

export default function ModulesPage() {
  return <ReferenceIndex group="modules" />;
}
