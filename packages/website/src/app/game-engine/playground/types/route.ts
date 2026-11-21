// The type declarations the playground editor needs for autocomplete and type checking, at the
// paths TypeScript resolves imports from. Built once at build time (a static JSON file).
import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";

export const dynamic = "force-static";

// Resolve from the website workspace so hoisted packages and workspace symlinks both work.
// The route reads these files during prerendering. turbopackIgnore keeps them out of the server trace.
const requireFromWebsite = createRequire(join(/* turbopackIgnore: true */ process.cwd(), "package.json"));
const packageDir = (name: string) =>
  dirname(requireFromWebsite.resolve(`${name}/package.json`));

async function declarations(dir: string): Promise<string[]> {
  const entries = await readdir(/* turbopackIgnore: true */ dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(/* turbopackIgnore: true */ dir, entry.name);
      if (entry.isDirectory()) return declarations(path);
      return Promise.resolve(entry.name.endsWith(".d.ts") ? [path] : []);
    }),
  );
  return files.flat();
}

export async function GET() {
  const libs: { path: string; content: string }[] = [];
  const add = async (path: string, file: string) =>
    libs.push({ path, content: await readFile(/* turbopackIgnore: true */ file, "utf8") });

  const engine = packageDir("@nayan-ui/engine");
  for (const file of await declarations(join(/* turbopackIgnore: true */ engine, "lib/web/types")))
    await add(`file:///node_modules/@nayan-ui/engine/${relative(engine, file)}`, file);
  libs.push({
    path: "file:///node_modules/@nayan-ui/engine/index.d.ts",
    content: 'export * from "./lib/web/types/src/index";\n',
  });
  // The same editor also runs the focused imports used in component reference examples.
  for (const entry of ["components", "animations", "drawing", "games", "markdown", "video"]) {
    libs.push({
      path: `file:///node_modules/@nayan-ui/engine/${entry}.d.ts`,
      content: `export * from "./lib/web/types/src/${entry}/index";\n`,
    });
  }
  libs.push({
    path: "file:///node_modules/@nayan-ui/engine/icons/catalog.d.ts",
    content: 'export * from "../lib/web/types/src/components/icons/index";\n',
  });

  const react = packageDir("@types/react");
  for (const name of ["index.d.ts", "global.d.ts", "jsx-runtime.d.ts"])
    await add(
      `file:///node_modules/@types/react/${name}`,
      join(/* turbopackIgnore: true */ react, name),
    );
  // React only uses csstype for style props; a small stand-in keeps this file ~900 KB lighter.
  libs.push({
    path: "file:///node_modules/csstype/index.d.ts",
    content:
      "export interface Properties<TLength = string | 0, TTime = string> { [property: string]: string | number | undefined }\n",
  });

  const compiler = packageDir("typescript");
  const standardLibraries = new Set<string>();
  async function addStandardLibrary(name: string) {
    if (standardLibraries.has(name)) return;
    standardLibraries.add(name);
    const content = await readFile(join(/* turbopackIgnore: true */ compiler, "lib", name), "utf8");
    libs.push({ path: `file:///node_modules/typescript/lib/${name}`, content });
    await Promise.all([...content.matchAll(/<reference lib="([\w.]+)"\s*\/>/g)].map(([, lib]) =>
      addStandardLibrary(`lib.${lib}.d.ts`)
    ));
  }
  await addStandardLibrary("lib.es2020.full.d.ts");

  return Response.json({ libs });
}
