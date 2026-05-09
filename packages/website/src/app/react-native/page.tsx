import JsonLd from '@/helpers/JsonLd';
import Components from '@/react-native/components/Components';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'React Native Components',
  description: 'Browse React Native UI components from Nayan UI. Native mobile components for iOS and Android built on HeroUI Native and Uniwind.',
  path: '/react-native',
  keywords: 'react native components, nayan ui react native, mobile ui library, ios components, android components, heroui native'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'React Native', url: `${SITE_URL}/react-native` }
  ])
];

export default function ReactNativePage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Components />
    </>
  );
}
