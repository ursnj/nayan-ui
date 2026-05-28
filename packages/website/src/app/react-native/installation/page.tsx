import JsonLd from '@/helpers/JsonLd';
import Installation from '@/react-native/installation/Installation';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Installation - React Native Components',
  description:
    'Install and configure @nayan-ui/native in your project. Setup guide for HeroUI Native, Uniwind, and theme configuration for iOS and Android.',
  path: '/react-native/installation',
  keywords: 'nayan ui react native installation, react native component setup, heroui native setup, uniwind configuration'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'React Native', url: `${SITE_URL}/react-native/components` },
    { name: 'Installation', url: `${SITE_URL}/react-native/installation` }
  ]),
  buildTechArticleSchema({
    title: 'Installation - React Native Components',
    description: 'Install and configure @nayan-ui/native in your project.',
    url: `${SITE_URL}/react-native/installation`
  })
];

export default function RNInstallationPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Installation />
    </>
  );
}
