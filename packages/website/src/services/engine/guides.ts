import { sectionExamples } from "./section-examples";
import { PracticalGuides } from "./practical-guides";
import { GettingStartedGuides } from "./getting-started";
import { WorldRenderingGuides } from "./world-rendering";
import { AssetsGeometryGuides } from "./assets-geometry";
import { ProceduralWorldGuides } from "./procedural-worlds";
import { MediaPerformanceGuides } from "./media-performance";
import { DrawingGuides } from "./drawing";
import { apiReferenceGuide } from "./api-reference";
const guides = [
  ...GettingStartedGuides,
  ...PracticalGuides,
  ...WorldRenderingGuides,
  ...AssetsGeometryGuides,
  ...ProceduralWorldGuides,
  ...MediaPerformanceGuides,
  ...DrawingGuides,
  apiReferenceGuide,
];

export const engineGuides = guides.map((guide) => ({
  ...guide,
  sections: guide.sections.map((section) => ({
    ...section,
    examples: [...(section.examples ?? []), ...(sectionExamples[guide.slug]?.[section.id] ?? [])],
  })),
}));
