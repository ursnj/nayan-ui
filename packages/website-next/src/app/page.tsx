import JsonLd from '@/helpers/JsonLd';
import Home from '@/home/Home';
import { SITE_URL, buildPageMetadata } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Open Source React & React Native Component Library',
  description:
    'Nayan UI is an open source component library providing 50+ accessible, customizable UI components for React and React Native. Built on HeroUI and Tailwind CSS. MIT licensed.',
  path: '/',
  keywords:
    'react component library, react native components, open source ui library, tailwind css components, heroui, typescript, accessibility, dark mode, nayan ui',
  ogType: 'website'
});

const homePageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Nayan UI - Open Source React & React Native Component Library',
  description: metadata.description,
  url: SITE_URL,
  isPartOf: { '@type': 'WebSite', name: 'Nayan UI', url: SITE_URL },
  about: {
    '@type': 'SoftwareApplication',
    name: 'Nayan UI',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web, iOS, Android'
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
