import Games from '@/games/Games';
import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'React Native Games',
  description: 'Collection of classic games for React Native applications. Puzzle, arcade, and casual games ready to integrate into your mobile app.',
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
    name: 'Nayan UI React Native Games',
    applicationCategory: 'GameApplication',
    operatingSystem: 'iOS, Android',
    description: 'Collection of classic games for React Native applications.',
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
