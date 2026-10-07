import type { Metadata } from "next";
import { TOOL_COUNT, TOTAL_COMPONENT_COUNT } from "./Counts";

export const SITE_URL = "https://www.nayanui.com";
export const REPO_URL = "https://github.com/ursnj/nayan-ui";
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");
export const SITE_NAME = "Nayan UI";
export const SITE_DESCRIPTION = `Nayan UI is an open source component library for React and React Native with ${TOTAL_COMPONENT_COUNT} accessible, production-ready UI components, plus ${TOOL_COUNT} free online developer tools for PDFs, images, JSON, text and AI code review. Built on HeroUI and Tailwind CSS.`;

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
  version: "2.0.0",
  datePublished: "2024-01-01",
  dateModified: new Date().toISOString().split("T")[0],
  author: { "@type": "Organization", name: SITE_NAME },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  programmingLanguage: ["TypeScript", "JavaScript", "React", "React Native"],
  runtimePlatform: ["Web Browser", "React Native", "Node.js"],
  requirements: "React 18+, TypeScript 4.5+, Tailwind CSS 4.0+",
  featureList: [
    "35 React Components",
    "React Native Support",
    "54 Free Developer Tools",
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
    about: { "@type": "Thing", name: "React Component Library" },
  };
}

export function buildPageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  ogType?: string;
}): Metadata {
  const url = `${SITE_URL}${opts.path}`;
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
      images: [{ url: `${SITE_URL}/banner.png` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} - ${opts.title}`,
      description: opts.description,
      images: [`${SITE_URL}/banner.png`],
    },
  };
}
