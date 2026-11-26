// Structured data for the engine docs pages, built from the same guide data the pages render.
import {
  ENGINE_URL,
  REPO_URL,
  SITE_URL,
  buildBreadcrumbSchema,
  buildHowToSchema,
  buildPageMetadata,
  buildTechArticleSchema,
  engineAbout,
  engineSoftwareSchema,
} from "@/services/seo";
import type { EngineGuide } from "./types";

const DOCS = { name: "Nayan Game Engine documentation", url: ENGINE_URL };
const KEYWORDS =
  "Nayan Game Engine, React game engine, React Native game engine, Rust, WebAssembly, WebGPU";

/** A guide's own URL: the overview is the docs' home. */
export const guideUrl = (guide: EngineGuide) =>
  guide.slug === "overview" ? ENGINE_URL : `${ENGINE_URL}/${guide.slug}`;

/** Search keywords: the guide's title words first, then the engine's. */
export const guideKeywords = (guide: EngineGuide) => `${guide.title}, ${KEYWORDS}, documentation`;

/** Breadcrumb, TechArticle and, where the guide has them, its numbered steps and source code. */
export function engineGuideSchemas(guide: EngineGuide, url = guideUrl(guide)) {
  const crumbs = [
    { name: "Home", url: SITE_URL },
    { name: "Nayan Game Engine", url: ENGINE_URL },
    ...(guide.slug === "overview" ? [] : [{ name: guide.title, url }]),
  ];
  const schemas: Record<string, unknown>[] = [
    buildBreadcrumbSchema(crumbs),
    buildTechArticleSchema({
      title: guide.title,
      description: guide.description,
      url,
      keywords: guideKeywords(guide),
      about: engineAbout,
      sections: guide.sections.map((section) => section.title),
      isPartOf: DOCS,
    }),
  ];
  if (guide.slug === "overview") schemas.push(engineSoftwareSchema);

  // Sections titled "1. …", "2. …" are steps: describe them as a HowTo.
  const steps = guide.sections.filter((section) => /^\d+\.\s/.test(section.title));
  if (steps.length >= 2)
    schemas.push(
      buildHowToSchema({
        name: guide.title,
        description: guide.description,
        tools: ["nayan-ui", "Bun"],
        steps: steps.map((section) => ({
          name: section.title.replace(/^\d+\.\s*/, ""),
          text: section.paragraphs.join(" "),
          url: `${url}#${section.id}`,
        })),
      }),
    );

  // Link the starter used by the first game guide.
  if (guide.slug === "first-game")
    schemas.push({
      "@context": "https://schema.org",
      "@type": "SoftwareSourceCode",
      name: "Nayan UI starter",
      description:
        "A Bun workspace with a landing page shared by Expo and Vite apps.",
      codeRepository: `${REPO_URL}/tree/main/packages/example`,
      programmingLanguage: ["TypeScript", "React", "React Native"],
      runtimePlatform: ["iOS", "Android", "Web"],
      targetProduct: engineAbout,
      url,
    });
  return schemas;
}

export function engineGuideMetadata(guide: EngineGuide, path = new URL(guideUrl(guide)).pathname) {
  return buildPageMetadata({
    // The brand suffix only where the title stays short enough for search results.
    title: guide.title.length <= 40 ? `${guide.title} · Nayan Game Engine` : guide.title,
    // Short guide descriptions get the engine's context, so the search snippet says what it is.
    description:
      guide.description.length < 110
        ? `${guide.description} Nayan Game Engine docs for React and React Native games.`
        : guide.description,
    path,
    bannerFor: new URL(guideUrl(guide)).pathname,
    keywords: guideKeywords(guide),
  });
}
