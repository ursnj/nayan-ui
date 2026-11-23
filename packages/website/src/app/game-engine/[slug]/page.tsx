import { notFound } from "next/navigation";
import NayanGameEngineDocumentation from "@/components/nayan-game-engine/NayanGameEngineDocumentation";
import JsonLd from "@/components/helpers/JsonLd";
import { engineGuides } from "@/services/nayan-ui/guides";
import { engineGuideMetadata, engineGuideSchemas } from "@/services/nayan-ui/seo";

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
  return engineGuideMetadata(guide);
}

export default async function EngineGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) notFound();
  return (
    <>
      <JsonLd data={engineGuideSchemas(guide)} />
      <NayanGameEngineDocumentation guide={guide} />
    </>
  );
}
