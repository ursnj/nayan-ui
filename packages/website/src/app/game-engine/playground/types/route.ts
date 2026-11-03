// The type declarations the playground editor needs for autocomplete and type checking, at the
// paths TypeScript resolves imports from. Built once at build time (a static JSON file).
import { readdir, readFile, realpath } from "node:fs/promises";
import { join, relative } from "node:path";

export const dynamic = "force-static";

// The website's own node_modules (builds and the dev server run from packages/website). Paths are
// followed to their real location, where each package's dependencies sit next to it. The route is
// prerendered, so its files are read at build time only: turbopackIgnore keeps them out of the
// server's traced output.
const packageDir = (name: string) =>
  realpath(join(/* turbopackIgnore: true */ process.cwd(), "node_modules", name));

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

  const engine = await packageDir("@nayan-ui/engine");
  for (const file of await declarations(join(/* turbopackIgnore: true */ engine, "lib/web/types")))
    await add(`file:///node_modules/@nayan-ui/engine/${relative(engine, file)}`, file);
  libs.push({
    path: "file:///node_modules/@nayan-ui/engine/index.d.ts",
    content: 'export * from "./lib/web/types/src/index";\n',
  });

  const react = await packageDir("@types/react");
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

  return Response.json({ libs });
}
