import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
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
  assert.deepEqual(collectPublicPaths(root), ["/", "/about", "/game-engine/examples/new-example"]);
});

test("tag URLs require a current component owner with a real public page", () => {
  const root = fixture({
    "react/button/page.tsx": "export default function Button() {}",
    "react/tags/[tag]/page.tsx": "export default function Tag() {}",
    "react-native/tags/[tag]/page.tsx": "export default function Tag() {}",
  });
  const paths = collectPublicPaths(root);
  assert.ok(paths.includes("/react/tags/react-button"));
  assert.ok(!paths.some((path) => path.startsWith("/react-native/tags/")));
  assert.ok(!paths.includes("/react/tags/react-accordion"));
});

test("a new dynamic route cannot silently disappear from the sitemap", () => {
  const root = fixture({ "blog/[slug]/page.tsx": "export default function Post() {}" });
  assert.throws(() => collectPublicPaths(root), /Add sitemap handling.*\/blog\/\[slug\]/);
});

test("XML output is deterministic, unique and escaped", () => {
  const paths = ["/tools/paint&draw", "/", "/tools/paint&draw"];
  const xml = renderSitemap(paths);
  assert.equal(xml, renderSitemap([...paths].reverse()));
  assert.equal(xml.match(/<loc>/g)?.length, 2);
  assert.ok(xml.includes("/tools/paint&amp;draw</loc>"));
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
});
