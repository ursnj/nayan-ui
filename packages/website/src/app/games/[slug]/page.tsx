import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GameDetail from '@/games/GameDetail';
import JsonLd from '@/helpers/JsonLd';
import { gamesData } from '@/services/GamesData';
import { SITE_NAME, SITE_URL, buildBreadcrumbSchema } from '@/services/seo';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return Object.keys(gamesData).map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const game = gamesData[slug];

  if (!game) {
    return { title: 'Game Not Found' };
  }

  const url = `${SITE_URL}/games/${slug}`;

  return {
    title: `${game.name} - React Native Game`,
    description: `${game.name}: ${game.description} Part of @nayan-ui/games - a collection of ${Object.keys(gamesData).length}+ React Native games.`,
    keywords: [
      `${game.name} react native`,
      `react native ${game.category.toLowerCase()} game`,
      ...game.tags,
      'react native games',
      'nayan ui games',
      'mobile game component'
    ].join(', '),
    alternates: { canonical: url },
    openGraph: {
      title: `${SITE_NAME} - ${game.name}`,
      description: `${game.name}: ${game.description}`,
      url,
      type: 'article',
      siteName: SITE_NAME,
      images: [{ url: `${SITE_URL}/games/${slug}.png`, width: 800, height: 800, alt: `${game.name} Game` }]
    },
    twitter: {
      card: 'summary',
      title: `${SITE_NAME} - ${game.name}`,
      description: `${game.name}: ${game.description}`,
      images: [`${SITE_URL}/games/${slug}.png`]
    }
  };
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = gamesData[slug];

  if (!game) {
    notFound();
  }

  const schemas = [
    buildBreadcrumbSchema([
      { name: 'Home', url: SITE_URL },
      { name: 'Games', url: `${SITE_URL}/games` },
      { name: game.name, url: `${SITE_URL}/games/${slug}` }
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      name: game.name,
      description: game.longDescription,
      genre: game.category,
      gamePlatform: ['iOS', 'Android', 'Web'],
      url: `${SITE_URL}/games/${slug}`,
      image: `${SITE_URL}/games/${slug}.png`,
      author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      applicationCategory: 'GameApplication',
      operatingSystem: 'iOS, Android, Web',
      contentRating: game.ageRating,
      isAccessibleForFree: true,
      keywords: game.tags.join(', ')
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `How to Play ${game.name}`,
      description: `Learn how to play ${game.name}`,
      step: game.howToPlay.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: `Step ${index + 1}`,
        text: step
      }))
    }
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <GameDetail slug={slug} />
    </>
  );
}
