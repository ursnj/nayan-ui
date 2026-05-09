import GamesLicensing from '@/games/Licensing';
import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Games Licensing',
  description: 'License information, commercial usage terms, and acknowledgments for react-native-games package.',
  path: '/games/licensing',
  keywords: 'react native games license, game library licensing, commercial usage, MIT license'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Games', url: `${SITE_URL}/games` },
    { name: 'Licensing', url: `${SITE_URL}/games/licensing` }
  ])
];

export default function GamesLicensingPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <GamesLicensing />
    </>
  );
}
