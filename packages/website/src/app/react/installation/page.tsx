import JsonLd from '@/helpers/JsonLd';
import Installation from '@/react/installation/Installation';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Installation - React Components',
  description:
    'Install and configure @nayan-ui/react in your project. Setup guide for Tailwind CSS integration, theme configuration, and usage examples.',
  path: '/react/installation',
  keywords: 'nayan ui installation, react component setup, tailwind css configuration, heroui setup, npm install nayan-ui'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'React', url: `${SITE_URL}/react/components` },
    { name: 'Installation', url: `${SITE_URL}/react/installation` }
  ]),
  buildTechArticleSchema({
    title: 'Installation - React Components',
    description: 'Install and configure @nayan-ui/react in your project.',
    url: `${SITE_URL}/react/installation`
  })
];

export default function InstallationPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Installation />
    </>
  );
}
