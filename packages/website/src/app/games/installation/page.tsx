import GamesInstallation from '@/games/Installation';
import JsonLd from '@/helpers/JsonLd';
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from '@/services/seo';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Games Installation',
  description: 'Installation guide and setup instructions for react-native-games. Learn how to add classic games to your React Native app.',
  path: '/games/installation',
  keywords: 'react native games installation, mobile game setup, react native game library setup'
});

const schemas = [
  buildBreadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Games', url: `${SITE_URL}/games` },
    { name: 'Installation', url: `${SITE_URL}/games/installation` }
  ]),
  buildTechArticleSchema({
    title: 'Games Installation',
    description: 'Installation guide and setup instructions for react-native-games.',
    url: `${SITE_URL}/games/installation`
  })
];

export default function GamesInstallationPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <GamesInstallation />
    </>
  );
}
