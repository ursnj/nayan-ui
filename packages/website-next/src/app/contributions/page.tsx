import Contributions from '@/contributions/Contributions';
import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Contributions - Open Source Contributors',
  description: 'Meet the contributors behind Nayan UI. Learn how to contribute to the open source React and React Native component library.',
  path: '/contributions',
  keywords: 'nayan ui contributors, open source, contribute to nayan ui, react component library contributors'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Contributions', url: `${SITE_URL}/contributions` }
  ])
];

export default function ContributionsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Contributions />
    </>
  );
}
