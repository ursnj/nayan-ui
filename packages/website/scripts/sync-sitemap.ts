import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gamesData } from "../src/services/GamesData";
import { engineNavigation } from "../src/services/engine/navigation";
import { SITE_URL } from "../src/services/seo";
import {
  getMenuItemByTag,
  reactSidebarItems,
  reactNativeSidebarItems,
  toolsSidebarItems,
  type SidebarItem,
} from "../src/services/Utils";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "src/app");
const OUTPUT = join(ROOT, "public/sitemap.xml");
const TAGS: Record<string, readonly SidebarItem[]> = {
  "/react/tags/[tag]": reactSidebarItems,
  "/react-native/tags/[tag]": reactNativeSidebarItems,
  "/tools/tags/[tag]": toolsSidebarItems,
};
const noindex = (file: string) =>
  existsSync(file) && /\brobots\s*:\s*\{[^}]*\bindex\s*:\s*false/.test(readFileSync(file, "utf8"));

/** Page files supply static URLs; the same registries used by pages supply dynamic URLs. */
export function collectPublicPaths(app = APP): string[] {
  const paths = new Set<string>();
  const dynamic = new Set<string>();
  const walk = (directory: string, inheritedNoindex = false) => {
    const hidden = inheritedNoindex || noindex(join(directory, "layout.tsx"));
    const page = join(directory, "page.tsx");
    if (existsSync(page) && !hidden && !noindex(page)) {
      const segments = relative(app, directory)
        .split(/[\\/]/)
        .filter((part) => part && !part.startsWith("("));
      const route = `/${segments.join("/")}`;
      if (route.includes("[")) dynamic.add(route);
      else paths.add(route);
    }
    for (const child of readdirSync(directory, { withFileTypes: true })) {
      // Next private folders and parallel slots are not independent public routes.
      if (child.isDirectory() && !child.name.startsWith("_") && !child.name.startsWith("@"))
        walk(join(directory, child.name), hidden);
    }
  };
  walk(app);
  for (const route of dynamic) {
    if (route === "/game-engine/[slug]") {
      engineNavigation.forEach((guide) => paths.add(guide.link));
    } else if (route === "/games/[slug]") {
      Object.keys(gamesData).forEach((slug) => paths.add(`/games/${slug}`));
    } else if (!(route in TAGS)) {
      throw new Error(`Add sitemap handling for the new dynamic page: ${route}`);
    }
  }
  for (const route of dynamic) {
    const items = TAGS[route];
    if (!items) continue;
    const prefix = route.slice(0, -"[tag]".length);
    for (const item of items) {
      if (!paths.has(item.link)) continue;
      for (const tag of item.tags ?? []) {
        const owner = getMenuItemByTag(tag.sku, prefix);
        if (owner && paths.has(owner.link)) paths.add(`${prefix}${encodeURIComponent(tag.sku)}`);
      }
    }
  }
  return [...paths].sort();
}

const escapeXml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]!,
  );

export function renderSitemap(paths: readonly string[]): string {
  const urls = [...new Set(paths)].sort().map((path) => {
    const hub =
      path === "/" ||
      ["/react", "/react-native", "/games", "/tools", "/game-engine", "/video-editor"].includes(
        path,
      );
    const tag = path.includes("/tags/");
    const frequency =
      hub || path.startsWith("/tools/") || path.includes("/examples") ? "weekly" : "monthly";
    const priority = path === "/" ? "1.0" : hub ? "0.9" : tag ? "0.5" : "0.8";
    return `  <url>\n    <loc>${escapeXml(SITE_URL + (path === "/" ? "" : path))}</loc>\n    <changefreq>${frequency}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <!-- Generated from current pages and route registries by bun run sitemap:generate. -->\n${urls.join("\n")}\n</urlset>\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const paths = collectPublicPaths();
  const xml = renderSitemap(paths);
  const previous = existsSync(OUTPUT) ? readFileSync(OUTPUT, "utf8") : "";
  if (process.argv.includes("--check")) {
    if (previous !== xml) {
      console.error("Sitemap is out of date. Run bun run sitemap:generate.");
      process.exitCode = 1;
    } else console.log(`Sitemap is current: ${paths.length} unique public URLs.`);
  } else {
    if (previous !== xml) writeFileSync(OUTPUT, xml);
    console.log(`Generated sitemap: ${paths.length} unique public URLs.`);
  }
}
