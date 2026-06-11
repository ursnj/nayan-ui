import Games from '@/games/Games';
import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: '@nayan-ui/games - 50+ React Native Games',
  description: '50+ high-performance games for React Native applications. Puzzle, arcade, strategy, and casual games built with Skia, Reanimated, and TypeScript for smooth 60fps gameplay.',
  path: '/games',
  keywords: 'react native games, mobile games, react native game library, puzzle games, arcade games, nayan ui games'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Games', url: `${SITE_URL}/games` }
  ]),
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '@nayan-ui/games',
    applicationCategory: 'GameApplication',
    operatingSystem: 'iOS, Android, Web',
    description: '50+ high-performance games for React Native applications built with Skia, Reanimated, and TypeScript.',
    url: `${SITE_URL}/games`,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
  }
];

export default function GamesPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Games />
    </>
  );
}
