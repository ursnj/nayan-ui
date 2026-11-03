import type { Metadata } from "next";
import enginePackage from "@nayan-ui/engine/package.json";
import gamesPackage from "@nayan-ui/games/package.json";
import reactPackage from "../../../react/package.json";
import {
  NATIVE_COMPONENT_COUNT,
  REACT_COMPONENT_COUNT,
  TOOL_COUNT,
  TOTAL_COMPONENT_COUNT,
} from "./Counts";

export const SITE_URL = "https://www.nayanui.com";
export const REPO_URL = "https://github.com/ursnj/nayan-ui";
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");
export const SITE_NAME = "Nayan UI";
export const SITE_DESCRIPTION = `Nayan UI is an open source platform for React and React Native: ${TOTAL_COMPONENT_COUNT} accessible UI components, a 3D game engine, 50+ ready-made games, a browser video editor and ${TOOL_COUNT} free online developer tools for PDFs, images, JSON, text, SEO and AI code review.`;

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/banner.png`,
  description: SITE_DESCRIPTION,
  foundingDate: "2024",
  sameAs: [REPO_URL, "https://www.npmjs.com/org/nayan-ui"],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "technical support",
    url: REPO_URL,
  },
};

export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web, iOS, Android",
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  downloadUrl: "https://www.npmjs.com/package/@nayan-ui/react",
  version: reactPackage.version,
  datePublished: "2024-01-01",
  dateModified: new Date().toISOString().split("T")[0],
  author: { "@type": "Organization", name: SITE_NAME },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  programmingLanguage: ["TypeScript", "JavaScript", "React", "React Native"],
  runtimePlatform: ["Web Browser", "React Native", "Node.js"],
  requirements: "React 18+, TypeScript 4.5+, Tailwind CSS 4.0+",
  featureList: [
    `${REACT_COMPONENT_COUNT} React Components`,
    `${NATIVE_COMPONENT_COUNT} React Native Components`,
    "3D Game Engine for React and React Native",
    "50+ Ready-made Games",
    "Browser Video Editor",
    `${TOOL_COUNT} Free Developer Tools`,
    "PDF Tools — Merge, Split, Compress, Convert & More",
    "Image Tools — Compress, Resize, Crop, Convert, Watermark",
    "JSON Tools — Format, Validate, Convert to CSV/YAML/XML/Excel",
    "XML Tools — Format, Validate, Convert to JSON/CSV/YAML/TSV/Excel",
    "Text Tools — Compare, Count, Convert Case, Generate Slugs",
    "AI Code Review & Vulnerability Scanning",
    "TypeScript First",
    "Tailwind CSS Integration",
    "HeroUI Foundation",
    "Dark Mode Support",
    "Accessibility Compliant",
    "MIT Licensed",
  ],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: `${SITE_NAME} Documentation`,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "en-US",
  isAccessibleForFree: true,
  publisher: { "@type": "Organization", name: SITE_NAME },
};

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildTechArticleSchema(opts: {
  title: string;
  description: string;
  url: string;
  keywords?: string;
  /** What the article documents. Default: the React component library. */
  about?: Record<string, unknown>;
  /** The article's section headings, in order. */
  sections?: string[];
  /** The documentation set it belongs to (name and URL). */
  isPartOf?: { name: string; url: string };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `${SITE_NAME} - ${opts.title}`,
    description: opts.description,
    url: opts.url,
    datePublished: "2024-01-01",
    dateModified: new Date().toISOString().split("T")[0],
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/banner.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
    keywords: opts.keywords,
    inLanguage: "en-US",
    about: opts.about ?? { "@type": "Thing", name: "React Component Library" },
    ...(opts.sections?.length ? { articleSection: opts.sections } : {}),
    ...(opts.isPartOf
      ? { isPartOf: { "@type": "WebSite", name: opts.isPartOf.name, url: opts.isPartOf.url } }
      : {}),
  };
}

export function buildPageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  ogType?: string;
  /** Preview image for social cards (a path on this site). Default: the site banner. */
  image?: { path: string; width?: number; height?: number; alt?: string };
}): Metadata {
  const url = `${SITE_URL}${opts.path}`;
  const image = opts.image
    ? {
        url: `${SITE_URL}${opts.image.path}`,
        width: opts.image.width,
        height: opts.image.height,
        alt: opts.image.alt,
      }
    : { url: `${SITE_URL}/banner.png` };
  return {
    title: opts.title,
    description: opts.description,
    keywords:
      opts.keywords ||
      "React Component Library, React Native, UI Library, Nayan UI, Tailwind CSS, HeroUI, TypeScript, Accessibility",
    alternates: { canonical: url },
    openGraph: {
      title: `${SITE_NAME} - ${opts.title}`,
      description: opts.description,
      url,
      type: (opts.ogType as any) || "article",
      siteName: SITE_NAME,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} - ${opts.title}`,
      description: opts.description,
      images: [image.url],
    },
  };
}

/** FAQPage for questions shown on the page (the answers must match the visible text). */
export function buildFaqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

/** HowTo for numbered steps shown on the page. */
export function buildHowToSchema(opts: {
  name: string;
  description: string;
  steps: { name: string; text: string; url?: string }[];
  tools?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: opts.name,
    description: opts.description,
    inLanguage: "en-US",
    estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" },
    ...(opts.tools?.length
      ? { tool: opts.tools.map((name) => ({ "@type": "HowToTool", name })) }
      : {}),
    step: opts.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.url ? { url: step.url } : {}),
    })),
  };
}

export const ENGINE_URL = `${SITE_URL}/game-engine`;
export const GAMES_URL = `${SITE_URL}/games`;

/** @nayan-ui/engine as a software product (version from the installed package). */
export const engineSoftwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${ENGINE_URL}#software`,
  name: "Nayan Engine (@nayan-ui/engine)",
  alternateName: ["@nayan-ui/engine", "Nayan Engine"],
  applicationCategory: "DeveloperApplication",
  applicationSubCategory: "Game engine",
  operatingSystem: "iOS, Android, Web",
  description:
    "A 3D game engine for React and React Native with one TypeScript API and a shared Rust core: wgpu rendering (Metal, Vulkan, WebGPU, WebGL2), physics, animation, particles, audio and drawing.",
  url: ENGINE_URL,
  downloadUrl: "https://www.npmjs.com/package/@nayan-ui/engine",
  softwareVersion: enginePackage.version,
  license: "https://opensource.org/licenses/MIT",
  isAccessibleForFree: true,
  programmingLanguage: ["TypeScript", "Rust"],
  runtimePlatform: ["React", "React Native", "WebAssembly"],
  author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "One TypeScript API for iOS, Android and React websites",
    "Rust core: wgpu rendering with Metal, Vulkan, WebGPU and WebGL2",
    "Physics, animation, skeletal glTF clips and particles",
    "glTF models, textures, fonts and procedural geometry",
    "Audio mixer and native haptics",
    "Scoreboard, timers and effects for games",
  ],
};

/** @nayan-ui/games as a software product (version from the installed package). */
export const gamesSoftwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${GAMES_URL}#software`,
  name: "@nayan-ui/games",
  applicationCategory: "GameApplication",
  operatingSystem: "iOS, Android, Web",
  description:
    "50+ ready-made games for React Native apps and React websites, rendered by the Nayan engine.",
  url: GAMES_URL,
  downloadUrl: "https://www.npmjs.com/package/@nayan-ui/games",
  softwareVersion: gamesPackage.version,
  license: `${GAMES_URL}/licensing`,
  isAccessibleForFree: true,
  author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

/** Short reference to the games package, for `about` in its documentation pages. */
export const gamesAbout = {
  "@type": "SoftwareApplication",
  "@id": `${GAMES_URL}#software`,
  name: "@nayan-ui/games",
};

/** Short reference to the engine, for `about` in its documentation pages. */
export const engineAbout = {
  "@type": "SoftwareApplication",
  "@id": `${ENGINE_URL}#software`,
  name: "Nayan Engine",
};
