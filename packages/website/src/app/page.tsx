import JsonLd from '@/components/helpers/JsonLd';
import Home from '@/components/home/Home';
import { PRODUCTS } from '@/components/home/Showcase';
import { TOOL_COUNT } from '@/services/Counts';
import { SITE_URL, buildPageMetadata } from '@/services/seo';

export const metadata = buildPageMetadata({
  title: 'Nayan Engine, Games and Developer Guides',
  description: `Build cross-platform UI and 3D games with Nayan Engine for React and React Native. Play 50+ games and explore a browser video editor and ${TOOL_COUNT} developer tool guides.`,
  path: '/',
  keywords:
    'react component library, react native components, react game engine, react native game engine, 3d games, react native games, browser video editor, developer guides, pdf tools, image tools, json tools, ai code review, nayan ui',
  ogType: 'website'
});

const homePageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Nayan UI – Engine, Games and Developer Guides',
  description: metadata.description,
  url: SITE_URL,
  inLanguage: 'en-US',
  isPartOf: { '@type': 'WebSite', name: 'Nayan UI', url: SITE_URL },
  about: {
    '@type': 'SoftwareApplication',
    name: 'Nayan UI',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web, iOS, Android'
  },
  // Match the destinations shown in the homepage cards.
  mainEntity: {
    '@type': 'ItemList',
    name: 'Explore Nayan UI',
    numberOfItems: PRODUCTS.length,
    itemListElement: PRODUCTS.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.title,
      description: product.body,
      url: `${SITE_URL}${product.href}`
    }))
  }
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={homePageSchema} />
      <Home />
    </>
  );
}
