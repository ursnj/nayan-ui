import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { componentReferences } from "../src/services/nayan-ui/component-reference";
import { moduleReferences } from "../src/services/nayan-ui/module-reference";
import { findReferenceTag, referenceTopics, tagsForReference } from "../src/services/nayan-ui/reference-tags";
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

test("shared tag URLs include both platforms and modules with current public pages", () => {
  const root = fixture({
    "components/button/page.tsx": "export default function Button() {}",
    "modules/games/page.tsx": "export default function GameModule() {}",
    "tags/[tag]/page.tsx": "export default function Tag() {}",
  });
  const paths = collectPublicPaths(root);
  expect(paths).toEqual(expect.arrayContaining([
    "/tags/button", "/tags/react-button", "/tags/react-native-button", "/tags/game-development", "/tags/games",
  ]));
  expect(paths.some((path) => /^\/react(?:-native)?\/tags/.test(path))).toBe(false);
  expect(paths).not.toContain("/tags/react-accordion");
});

test("every engine reference has a topic and both platform docs share the same component tags", () => {
  const topics = new Set(referenceTopics.map(({ sku }) => sku));
  for (const { path } of [...componentReferences, ...moduleReferences]) {
    const tags = tagsForReference(path);
    expect(tags.some(({ sku }) => topics.has(sku))).toBe(true);
    expect(new Set(tags.map(({ sku }) => sku)).size).toBe(tags.length);
  }
  const buttonTags = tagsForReference("/components/button");
  expect(tagsForReference("/react/button")).toEqual(buttonTags);
  expect(tagsForReference("/react-native/button")).toEqual(buttonTags);
  expect(buttonTags.map(({ sku }) => sku)).toEqual(expect.arrayContaining(["react-button", "react-native-button"]));
  expect(findReferenceTag("game-development")?.entries.map(({ path }) => path)).toEqual(
    expect.arrayContaining(["/components/game-view", "/modules/games"]),
  );
});

test("a new dynamic route cannot silently disappear from the sitemap", () => {
  const root = fixture({ "blog/[slug]/page.tsx": "export default function Post() {}" });
  expect(() => collectPublicPaths(root)).toThrow(/Add sitemap handling.*\/blog\/\[slug\]/);
});

test("reference aliases are listed alongside existing component and game routes", () => {
  const root = fixture({
    "[entry]/page.tsx": "export default function Reference() {}",
    "react/alert/page.tsx": "export default function Alert() {}",
    "react-native/accordion/page.tsx": "export default function Accordion() {}",
    "modules/games/page.tsx": "export default function GameRuntime() {}",
    "games/page.tsx": "export default function Games() {}",
  });
  const paths = collectPublicPaths(root);
  expect(paths).toEqual(expect.arrayContaining([
    "/components/alert", "/components/confirm-alert", "/components/accordion", "/components/use-theme",
    "/modules/camera", "/modules/storage", "/modules/games", "/react/alert", "/react-native/accordion", "/games"
  ]));
  expect(paths).not.toContain("/alert");
  expect(paths).not.toContain("/camera");
});

test("XML output is deterministic, unique and escaped", () => {
  const paths = ["/tools/paint&draw", "/", "/tools/paint&draw"];
  const xml = renderSitemap(paths);
  expect(xml).toBe(renderSitemap([...paths].reverse()));
  expect(xml.match(/<loc>/g)).toHaveLength(2);
  expect(xml).toContain("/tools/paint&amp;draw</loc>");
  expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
});

test("only the canonical playground page is listed in the sitemap", () => {
  const paths = collectPublicPaths();
  expect(paths).toContain("/playground");
  expect(paths).not.toContain("/game-engine/playground");
  expect(paths).not.toContain("/playground/types");
});
