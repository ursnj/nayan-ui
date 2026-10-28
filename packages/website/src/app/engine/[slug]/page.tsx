import { notFound } from "next/navigation";
import EngineDocumentation from "@/components/engine/EngineDocumentation";
import JsonLd from "@/components/helpers/JsonLd";
import { engineGuides } from "@/services/engine/guides";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export function generateStaticParams() {
  return engineGuides
    .filter((guide) => guide.slug !== "overview")
    .map((guide) => ({ slug: guide.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = engineGuides.find((item) => item.slug === slug && item.slug !== "overview");
  if (!guide) notFound();
  return buildPageMetadata({
    title: `${guide.title} · Nayan Engine`,
    description: guide.description,
    path: `/engine/${slug}`,
    keywords:
      "Nayan engine, React game engine, React Native game engine, Rust, WebAssembly, WebGPU, documentation",
  });
}
export default async function EngineGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = engineGuides.find((item) => item.slug === slug && item.slug !== "overview");
  if (!guide) notFound();
  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema([
            { name: "Home", url: SITE_URL },
            { name: "Engine", url: `${SITE_URL}/engine` },
            { name: guide.title, url: `${SITE_URL}/engine/${slug}` },
          ]),
          buildTechArticleSchema({
            title: guide.title,
            description: guide.description,
            url: `${SITE_URL}/engine/${slug}`,
          }),
        ]}
      />
      <EngineDocumentation guide={guide} />
    </>
  );
}
