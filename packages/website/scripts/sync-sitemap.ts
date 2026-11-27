import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gamesData } from '../src/services/GamesData';
import { componentReferences } from '../src/services/ui/component-reference';
import { moduleReferences } from '../src/services/ui/module-reference';
import { engineNavigation } from '../src/services/ui/navigation';
import { referenceTopics } from '../src/services/ui/reference-tags';
import { SITE_URL } from '../src/services/seo';
import { canonicalPageAliases } from '../src/services/site-routes';
import { toolTopics } from '../src/services/tool-topics';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP = join(ROOT, 'src/app');
const OUTPUT = join(ROOT, 'public/sitemap.xml');
const ALIAS_ROUTES = new Set(['/[entry]', '/react/tags/[tag]', '/react-native/tags/[tag]', '/tools/tags/[tag]']);
const noindex = (file: string) => existsSync(file) && /\brobots\s*:\s*\{[^}]*\bindex\s*:\s*false/.test(readFileSync(file, 'utf8'));

/** Page files supply static URLs; the same registries used by pages supply dynamic URLs. */
export function collectPublicPaths(app = APP): string[] {
  const paths = new Set<string>();
  const dynamic = new Set<string>();
  const walk = (directory: string, inheritedNoindex = false) => {
    const hidden = inheritedNoindex || noindex(join(directory, 'layout.tsx'));
    const page = join(directory, 'page.tsx');
    if (existsSync(page) && !hidden && !noindex(page)) {
      const segments = relative(app, directory)
        .split(/[\\/]/)
        .filter((part) => part && !part.startsWith('('));
      const route = `/${segments.join('/')}`;
      if (route.includes('[')) dynamic.add(route);
      else if (!Object.hasOwn(canonicalPageAliases, route)) paths.add(route);
    }
    for (const child of readdirSync(directory, { withFileTypes: true })) {
      // Next private folders and parallel slots are not independent public routes.
      if (child.isDirectory() && !child.name.startsWith('_') && !child.name.startsWith('@')) walk(join(directory, child.name), hidden);
    }
  };
  walk(app);
  for (const route of dynamic) {
    if (route === '/game-engine/[slug]') {
      engineNavigation.forEach((guide) => paths.add(guide.link));
    } else if (route === '/components/[entry]') {
      componentReferences.forEach(({ path }) => paths.add(path));
    } else if (route === '/modules/[entry]') {
      moduleReferences.forEach(({ slug, path }) => {
        if (slug !== 'games') paths.add(path);
      });
    } else if (route === '/games/[slug]') {
      Object.keys(gamesData).forEach((slug) => paths.add(`/games/${slug}`));
    } else if (route !== '/tags/[tag]' && route !== '/tools/topics/[topic]' && !ALIAS_ROUTES.has(route)) {
      throw new Error(`Add sitemap handling for the new dynamic page: ${route}`);
    }
  }
  if (dynamic.has('/tags/[tag]')) {
    for (const { sku, entries } of referenceTopics) {
      if (entries.filter(({ path }) => paths.has(path)).length > 1) paths.add(`/tags/${encodeURIComponent(sku)}`);
    }
  }
  if (dynamic.has('/tools/topics/[topic]')) {
    for (const { path, tools } of toolTopics) {
      if (tools.length > 1 && tools.every(({ link }) => paths.has(link))) paths.add(path);
    }
  }
  return [...paths].sort();
}

const escapeXml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]!);

export function renderSitemap(paths: readonly string[]): string {
  const urls = [...new Set(paths)]
    .sort()
    .map((path) => `  <url>\n    <loc>${escapeXml(path === '/' ? SITE_URL : SITE_URL + path)}</loc>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <!-- Generated from current pages and route registries by bun run sitemap:generate. -->\n${urls.join('\n')}\n</urlset>\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const paths = collectPublicPaths();
  const xml = renderSitemap(paths);
  const previous = existsSync(OUTPUT) ? readFileSync(OUTPUT, 'utf8') : '';
  if (process.argv.includes('--check')) {
    if (previous !== xml) {
      console.error('Sitemap is out of date. Run bun run sitemap:generate.');
      process.exitCode = 1;
    } else console.log(`Sitemap is current: ${paths.length} unique public URLs.`);
  } else {
    if (previous !== xml) writeFileSync(OUTPUT, xml);
    console.log(`Generated sitemap: ${paths.length} unique public URLs.`);
  }
}
