import JsonLd from '@/helpers/JsonLd';
import Components from '@/react-native/components/Components';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'React Native Components',
  description:
    'Browse React Native UI components from Nayan UI. Accordion, button, card, dialog, input, menu, sheet, tabs, toast, and more for iOS and Android.',
  path: '/react-native/components',
  keywords: 'react native components, mobile ui components, nayan ui react native, ios android components, heroui native'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'React Native Components', url: `${SITE_URL}/react-native/components` }
  ])
];

export default function RNComponentsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Components />
    </>
  );
}
