// Structured data for the engine docs pages, built from the same guide data the pages render.
import {
  ENGINE_URL,
  REPO_URL,
  SITE_URL,
  buildBreadcrumbSchema,
  buildHowToSchema,
  buildTechArticleSchema,
  engineAbout,
  engineSoftwareSchema,
} from "@/services/seo";
import type { EngineGuide } from "./types";

const DOCS = { name: "Nayan Engine documentation", url: ENGINE_URL };
const KEYWORDS =
  "Nayan engine, React game engine, React Native game engine, Rust, WebAssembly, WebGPU";

/** A guide's own URL: the overview is the docs' home. */
export const guideUrl = (guide: EngineGuide) =>
  guide.slug === "overview" ? ENGINE_URL : `${ENGINE_URL}/${guide.slug}`;

/** Search keywords: the guide's title words first, then the engine's. */
export const guideKeywords = (guide: EngineGuide) => `${guide.title}, ${KEYWORDS}, documentation`;

/** Breadcrumb, TechArticle and, where the guide has them, its numbered steps and source code. */
export function engineGuideSchemas(guide: EngineGuide) {
  const url = guideUrl(guide);
  const crumbs = [
    { name: "Home", url: SITE_URL },
    { name: "Game Engine", url: ENGINE_URL },
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
        tools: ["@nayan-ui/engine", "Bun"],
        steps: steps.map((section) => ({
          name: section.title.replace(/^\d+\.\s*/, ""),
          text: section.paragraphs.join(" "),
          url: `${url}#${section.id}`,
        })),
      }),
    );

  // The first game is the repo's games example: link its source.
  if (guide.slug === "first-game")
    schemas.push({
      "@context": "https://schema.org",
      "@type": "SoftwareSourceCode",
      name: "Nayan engine games example (Car Racing)",
      description:
        "A Bun workspace with Car Racing for iOS, Android and the web: shared game code, an Expo app and a Vite app.",
      codeRepository: `${REPO_URL}/tree/main/examples/games`,
      programmingLanguage: ["TypeScript", "React", "React Native"],
      runtimePlatform: ["iOS", "Android", "Web"],
      targetProduct: engineAbout,
      url,
    });
  return schemas;
}
