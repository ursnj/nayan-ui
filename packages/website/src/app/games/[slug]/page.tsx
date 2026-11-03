import type { GAME_IDS } from "@nayan-ui/games/services";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import GameDetail from "@/components/games/GameDetail";
import GameExperience from "@/components/games/GameExperience";
import JsonLd from "@/components/helpers/JsonLd";
import { gamesData } from "@/services/GamesData";
import {
  BANNER_HEIGHT,
  BANNER_WIDTH,
  SITE_NAME,
  SITE_URL,
  buildBreadcrumbSchema,
  seoBannerUrl,
} from "@/services/seo";
export async function generateStaticParams() {
  return Object.keys(gamesData).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = gamesData[slug];

  if (!game) {
    return { title: "Game Not Found" };
  }

  const url = `${SITE_URL}/games/${slug}`;
  const banner = seoBannerUrl(`/games/${slug}`);

  return {
    title: `Play ${game.name} Online · React & React Native`,
    description: `Play ${game.name} free online. ${game.description}`,
    keywords: [
      `play ${game.name} online`,
      `${game.name} browser game`,
      `${game.name} react native`,
      `react native ${game.category.toLowerCase()} game`,
      ...game.tags,
      "react native games",
      "nayan ui games",
      "mobile game component",
    ].join(", "),
    alternates: { canonical: url },
    openGraph: {
      title: `${SITE_NAME} - ${game.name}`,
      description: `${game.name}: ${game.description}`,
      url,
      type: "article",
      siteName: SITE_NAME,
      images: [
        {
          url: banner,
          width: BANNER_WIDTH,
          height: BANNER_HEIGHT,
          alt: `Play ${game.name} free online`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} - ${game.name}`,
      description: `${game.name}: ${game.description}`,
      images: [{ url: banner, alt: `Play ${game.name} free online` }],
    },
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
      { name: "Home", url: SITE_URL },
      { name: "Games", url: `${SITE_URL}/games` },
      { name: game.name, url: `${SITE_URL}/games/${slug}` },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "VideoGame",
      name: game.name,
      description: game.longDescription,
      genre: game.category,
      gamePlatform: ["iOS", "Android", "Web"],
      url: `${SITE_URL}/games/${slug}`,
      playMode: "SinglePlayer",
      potentialAction: { "@type": "PlayAction", target: `${SITE_URL}/games/${slug}` },
      image: [`${SITE_URL}/games/${slug}.png`, seoBannerUrl(`/games/${slug}`)],
      screenshot: `${SITE_URL}/games/${slug}.png`,
      inLanguage: "en-US",
      featureList: game.features,
      isPartOf: {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/games#page`,
        name: "50+ ready-made games",
        url: `${SITE_URL}/games`,
      },
      author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      applicationCategory: "GameApplication",
      operatingSystem: "iOS, Android, Web",
      contentRating: game.ageRating,
      isAccessibleForFree: true,
      keywords: game.tags.join(", "),
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `How to Play ${game.name}`,
      description: `How to play ${game.name}, in ${game.howToPlay.length} steps.`,
      inLanguage: "en-US",
      step: game.howToPlay.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.split(/[.;:]/)[0]!.trim(), // The step's first clause, as its short name.
        text: step,
      })),
    },
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <GameExperience
        key={slug}
        gameId={slug as GAME_IDS}
        title={game.name}
        description={game.description}
      >
        <GameDetail slug={slug} />
      </GameExperience>
    </>
  );
}
