import { notFound } from "next/navigation";
import EngineDocumentation from "@/components/engine/EngineDocumentation";
import JsonLd from "@/components/helpers/JsonLd";
import { engineGuides } from "@/services/engine/guides";
import { engineGuideSchemas, guideKeywords } from "@/services/engine/seo";
import { buildPageMetadata } from "@/services/seo";

const findGuide = (slug: string) =>
  engineGuides.find((item) => item.slug === slug && item.slug !== "overview");

export function generateStaticParams() {
  return engineGuides
    .filter((guide) => guide.slug !== "overview")
    .map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) notFound();
  return buildPageMetadata({
    // The brand suffix only where the title stays short enough for search results.
    title: guide.title.length <= 40 ? `${guide.title} · Nayan Game Engine` : guide.title,
    // Short guide descriptions get the engine's context, so the search snippet says what it is.
    description:
      guide.description.length < 110
        ? `${guide.description} Nayan Game Engine docs for React and React Native games.`
        : guide.description,
    path: `/game-engine/${slug}`,
    keywords: guideKeywords(guide),
  });
}

export default async function EngineGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) notFound();
  return (
    <>
      <JsonLd data={engineGuideSchemas(guide)} />
      <EngineDocumentation guide={guide} />
    </>
  );
}
