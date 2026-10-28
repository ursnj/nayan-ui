// Usage: bun scripts/check-engine-docs.ts /path/to/playtura/packages/engine
import ts from "typescript";
import { mkdtemp, mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { engineGuides } from "../src/services/engine/guides";
import { engineNavigation } from "../src/services/engine/navigation";
import { createRequire } from "node:module";
import inventory from "../src/services/engine/api-inventory.json";

const packagePath = process.argv[2];
if (!packagePath)
  throw new Error("Pass the engine package directory containing built declarations.");
const engine = resolve(packagePath);
const monorepo = resolve(engine, "../..");
const require = createRequire(join(engine, "package.json"));
const nativePackage = require.resolve("react-native/package.json");
const nativeMetadata = JSON.parse(await readFile(nativePackage, "utf8"));
const nativeTypes = resolve(
  nativePackage,
  "..",
  nativeMetadata.types ?? nativeMetadata.typings ?? nativeMetadata.exports["."].types,
);
const temporary = await mkdtemp(join(tmpdir(), "nayan-engine-docs-"));
let errors = 0;
const check = (ok: unknown, message: string) => {
  if (!ok) {
    console.error(message);
    errors++;
  }
};
const slugs = new Set(engineGuides.map((guide) => guide.slug));
check(slugs.size === engineGuides.length, "Duplicate guide slug");
check(engineNavigation.length === engineGuides.length, "Navigation and guide counts differ");
for (const item of engineNavigation) check(slugs.has(item.slug), `Missing guide: ${item.slug}`);
for (const guide of engineGuides) {
  check(guide.sections.length >= 2, `Guide needs detailed sections: ${guide.slug}`);
  check(
    new Set(guide.sections.map((section) => section.id)).size === guide.sections.length,
    `Duplicate section ID: ${guide.slug}`,
  );
}
const source = ts.createSourceFile(
  "index.ts",
  await readFile(join(engine, "src/index.ts"), "utf8"),
  ts.ScriptTarget.Latest,
  true,
);
const exported = source.statements.flatMap((statement) =>
  ts.isExportDeclaration(statement) &&
  statement.exportClause &&
  ts.isNamedExports(statement.exportClause)
    ? statement.exportClause.elements.map((item) => item.name.text)
    : [],
);
check(
  JSON.stringify([...exported].sort()) ===
    JSON.stringify(inventory.map((item) => item.name).sort()),
  "API snapshot does not cover the current engine exports; rerun sync-engine-reference.mjs",
);
for (const item of inventory)
  check(slugs.has(item.guide), `Unknown concept guide for ${item.name}: ${item.guide}`);
const sitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
for (const item of engineNavigation)
  check(
    sitemap.includes(`https://www.nayanui.com${item.link}</loc>`),
    `Missing sitemap URL: ${item.link}`,
  );

let examples = 0;
for (const platform of ["react", "native"] as const) {
  const directory = join(temporary, platform);
  await mkdir(directory);
  const files: string[] = [];
  const sceneGuide = engineGuides.find(
    (guide) => guide.slug === (platform === "react" ? "react" : "react-native"),
  )!;
  for (const section of sceneGuide.sections)
    for (const example of section.examples ?? []) {
      if (!/\.(ts|tsx)$/.test(example.title)) continue;
      const path = join(directory, example.title);
      await writeFile(path, example.code);
      files.push(path);
      examples++;
    }
  let index = 0;
  for (const guide of engineGuides) {
    if (["react", "react-native", "api-reference"].includes(guide.slug)) continue;
    for (const section of guide.sections)
      for (const example of section.examples ?? []) {
        if (example.language && example.language !== "tsx") continue;
        if (example.platform !== "shared" && example.platform !== platform) continue;
        const path = join(directory, `${guide.slug}-${index++}.tsx`);
        await writeFile(path, example.code);
        files.push(path);
        examples++;
      }
  }
  const options: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    esModuleInterop: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    lib: ["lib.esnext.d.ts", "lib.dom.d.ts"],
    types: ["node", "react"],
    typeRoots: [join(monorepo, "node_modules/@types")],
    paths: {
      "@nayan-ui/engine": [
        join(
          engine,
          platform === "react" ? "lib/web/types/src/index.d.ts" : "lib/typescript/src/index.d.ts",
        ),
      ],
      "@nayan-ui/engine/web": [join(engine, "lib/web/types/src/index.d.ts")],
      react: [join(monorepo, "node_modules/@types/react/index.d.ts")],
      "react/jsx-runtime": [join(monorepo, "node_modules/@types/react/jsx-runtime.d.ts")],
      "react-native": [nativeTypes],
    },
  };
  const program = ts.createProgram(files, options);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) {
    console.error(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (path) => path,
        getCurrentDirectory: () => directory,
        getNewLine: () => "\n",
      }),
    );
    errors += diagnostics.length;
  }
}
await rm(temporary, { recursive: true, force: true });
if (errors) throw new Error(`${errors} documentation validation errors`);
console.log(
  `Checked ${engineGuides.length} guides, ${inventory.length} public exports and ${examples} React/native example compilations.`,
);
