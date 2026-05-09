import JsonLd from '@/helpers/JsonLd';
import Components from '@/react/components/Components';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'React Components',
  description:
    'Browse 50+ React UI components from Nayan UI. Buttons, forms, modals, tables, navigation, and more. Built on HeroUI and Tailwind CSS with TypeScript support.',
  path: '/react/components',
  keywords: 'react components, nayan ui react, ui components list, button, input, dialog, table, accordion, toast, tailwind components'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'React Components', url: `${SITE_URL}/react/components` }
  ])
];

export default function ComponentsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Components />
    </>
  );
}
