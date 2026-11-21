import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { collectPublicPaths, renderSitemap } from "./sync-sitemap";

const fixtures: string[] = [];
function fixture(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), "nayan-sitemap-"));
  fixtures.push(root);
  for (const [path, content] of Object.entries(files)) {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  return root;
}
afterEach(() => {
  for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true });
});

test("new example pages are discovered without listing them manually; private and noindex pages stay out", () => {
  const root = fixture({
    "page.tsx": "export default function Home() {}",
    "game-engine/examples/new-example/page.tsx": "export default function Example() {}",
    "(public)/about/page.tsx": "export default function About() {}",
    "logo-preview/player/page.tsx": "export const metadata = { robots: { index: false } };",
    "hidden/layout.tsx": "export const metadata = { robots: { index: false } };",
    "hidden/deep/page.tsx": "export default function Hidden() {}",
    "_private/page.tsx": "export default function Private() {}",
    "@panel/page.tsx": "export default function Panel() {}",
    "api/data/route.ts": "export function GET() {}",
  });
  expect(collectPublicPaths(root)).toEqual(["/", "/about", "/game-engine/examples/new-example"]);
});

test("tag URLs require a current component owner with a real public page", () => {
  const root = fixture({
    "react/button/page.tsx": "export default function Button() {}",
    "react/tags/[tag]/page.tsx": "export default function Tag() {}",
    "react-native/tags/[tag]/page.tsx": "export default function Tag() {}",
  });
  const paths = collectPublicPaths(root);
  expect(paths).toContain("/react/tags/react-button");
  expect(paths.some((path) => path.startsWith("/react-native/tags/"))).toBe(false);
  expect(paths).not.toContain("/react/tags/react-accordion");
});

test("a new dynamic route cannot silently disappear from the sitemap", () => {
  const root = fixture({ "blog/[slug]/page.tsx": "export default function Post() {}" });
  expect(() => collectPublicPaths(root)).toThrow(/Add sitemap handling.*\/blog\/\[slug\]/);
});

test("root engine references are added alongside existing component and game routes", () => {
  const root = fixture({
    "[entry]/page.tsx": "export default function Reference() {}",
    "react/alert/page.tsx": "export default function Alert() {}",
    "react-native/accordion/page.tsx": "export default function Accordion() {}",
    "modules/games/page.tsx": "export default function GameRuntime() {}",
    "games/page.tsx": "export default function Games() {}",
  });
  expect(collectPublicPaths(root)).toEqual(expect.arrayContaining([
    "/alert", "/confirm-alert", "/accordion", "/storage", "/react/alert", "/react-native/accordion", "/games", "/modules/games"
  ]));
});

test("XML output is deterministic, unique and escaped", () => {
  const paths = ["/tools/paint&draw", "/", "/tools/paint&draw"];
  const xml = renderSitemap(paths);
  expect(xml).toBe(renderSitemap([...paths].reverse()));
  expect(xml.match(/<loc>/g)).toHaveLength(2);
  expect(xml).toContain("/tools/paint&amp;draw</loc>");
  expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
});
