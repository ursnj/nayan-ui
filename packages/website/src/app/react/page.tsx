import JsonLd from '@/helpers/JsonLd';
import Components from '@/react/components/Components';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'React Components',
  description:
    'Browse 50+ React UI components from Nayan UI. Buttons, forms, modals, tables, navigation, and more. Built on HeroUI and Tailwind CSS.',
  path: '/react',
  keywords: 'react components, nayan ui, ui library, tailwind css react, heroui components'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'React', url: `${SITE_URL}/react` }
  ])
];

export default function ReactPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Components />
    </>
  );
}
