// Refresh the API snapshot from a built engine checkout; never import the engine at website runtime.
// Usage from the repository root: bun packages/website/scripts/sync-nayan-reference.mjs packages/nayan-ui
import ts from "typescript";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
const engine = process.argv[2];
const check = process.argv.includes("--check");
if (!engine)
  throw new Error("Pass the engine package directory after building its browser declarations.");
const website = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const root = resolve(engine, "lib/web/types/src");
const entry = resolve(root, "index.d.ts");
const program = ts.createProgram([entry], {
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  skipLibCheck: true,
});
const checker = program.getTypeChecker();
const source = program.getSourceFile(entry);
if (!source) throw new Error(`Build the browser declarations first; missing ${entry}`);
const targets = {
  "world/World": "world-entities",
  "world/quat": "world-entities",
  "world/color": "camera-lighting",
  "world/effects": "particles",
  "world/Scoreboard": "scoreboard-timers",
  "world/types": "world-entities",
  "world/TransformBatch": "cache-performance",
  "render/GameView": "game-view",
  "render/useWorld": "world-entities",
  "render/light": "camera-lighting",
  "render/meshes": "cache-performance",
  "render/quality": "game-view",
  "assets/source": "models-textures",
  "assets/model": "models-textures",
  "assets/AssetCache": "cache-performance",
  "assets/texture": "models-textures",
  "assets/ProceduralCache": "cache-performance",
  "assets/modelling": "solid-modelling",
  "assets/loft": "surfaces-lofts",
  "assets/surface": "surfaces-lofts",
  "assets/shape": "procedural-geometry",
  "assets/procedural": "procedural-worlds",
  "assets/font": "text-fonts",
  "input/Joystick": "input-picking",
  "input/keyboard": "input-picking",
  types: "render-source",
  "drawing/DrawingDocument": "drawing",
  "drawing/DrawingCanvas": "drawing",
};
function guideFor(module) {
  const target = targets[module.replace(/^games\//, "")];
  if (target) return `/game-engine/${target}`;
  if (/^[a-z-]+\/index$/.test(module)) return `/modules/${module.slice(0, -6)}`;
  throw new Error(`Assign a detailed guide to new engine module ${module}`);
}

// Follow star exports such as games and drawing. A named root export is authoritative
// when more than one entry exports the same name.
const exportsByName = new Map();
const visited = new Set();
function collect(file) {
  if (visited.has(file)) return;
  visited.add(file);
  for (const statement of file.statements) {
    if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier) continue;
    const imported = checker.getSymbolAtLocation(statement.moduleSpecifier)?.declarations?.find(ts.isSourceFile);
    if (!imported) throw new Error(`Could not resolve ${statement.moduleSpecifier.getText(file)} from ${file.fileName}`);
    if (!statement.exportClause) {
      collect(imported);
      continue;
    }
    if (!ts.isNamedExports(statement.exportClause)) continue;
    const module = relative(root, imported.fileName).split(sep).join("/").replace(/\.d\.ts$/, "");
    for (const element of statement.exportClause.elements) {
      const alias = checker.getSymbolAtLocation(element.name);
      const symbol = alias && (alias.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(alias) : alias);
      const declarations = symbol?.getDeclarations();
      if (!declarations?.length) throw new Error(`Could not resolve the declaration for ${element.name.text}`);
      exportsByName.set(element.name.text, {
        name: element.name.text,
        typeOnly: statement.isTypeOnly || element.isTypeOnly,
        module,
        declarations,
      });
    }
  }
}
collect(source);
const publicNames = checker.getExportsOfModule(checker.getSymbolAtLocation(source)).map((item) => item.name);
if (publicNames.length !== exportsByName.size || publicNames.some((name) => !exportsByName.has(name))) {
  throw new Error("The API inventory differs from the built compatibility entry.");
}
const groups = Map.groupBy(exportsByName.values(), (item) => item.module);
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const members = [];
const sections = [
  {
    id: "reading-the-reference",
    title: "Reading the reference",
    paragraphs: [
      "This index lists the exports of the nayan-ui compatibility entry. Signatures come from the built browser declarations. Use the focused module references for each platform’s behavior and additional subpath exports.",
      "Use declarations to look up types. Use the runnable examples and linked guides for setup, behavior and cleanup.",
    ],
    examples: [
      {
        title: "Import runtime APIs and types from one entry",
        platform: "shared",
        language: "tsx",
        code: `import { GameView, useWorld, type Entity, type EntityOptions } from "nayan-ui";

const ball: EntityOptions = { mesh: "sphere", color: "#33B3FF", physics: "dynamic" };

export function Ball() {
  let handle: Entity | null = null;
  const world = useWorld(16, (w) => { handle = w.spawn(ball); });
  return world && <GameView source={world} onTap={() => handle !== null && world.impulse(handle, [0, 4, 0])} />;
}`,
      },
    ],
  },
];
for (const [module, symbols] of groups) {
  const guide = guideFor(module);
  const heading = module.replace(/^games\//, "").replace(/\/index$/, "");
  const declarations = [];
  const publicDeclarations = new Set(symbols.flatMap((item) => item.declarations).map((node) => {
    return ts.isVariableDeclaration(node) ? node.parent.parent : node;
  }));
  for (const statement of publicDeclarations) {
    let node = statement;
    if (ts.isClassDeclaration(statement)) {
      node = ts.factory.updateClassDeclaration(
        statement,
        statement.modifiers,
        statement.name,
        statement.typeParameters,
        statement.heritageClauses,
        statement.members.filter(
          (member) =>
            !member.modifiers?.some(
              (m) =>
                m.kind === ts.SyntaxKind.PrivateKeyword ||
                m.kind === ts.SyntaxKind.ProtectedKeyword,
            ),
        ),
      );
    }
    declarations.push(printer.printNode(ts.EmitHint.Unspecified, node, statement.getSourceFile()));
  }
  for (const symbol of symbols)
    members.push({ name: symbol.name, module, typeOnly: symbol.typeOnly, guide });
  sections.push({
    id: heading.replaceAll("/", "-"),
    title: heading,
    paragraphs: [],
    table: {
      headers: ["Export", "Kind", "Guide"],
      rows: symbols.map((s) => [
        s.name,
        s.typeOnly ? "TypeScript type" : "Runtime API",
        guide,
      ]),
    },
    examples: [
      {
        title: `${heading} declarations`,
        platform: "shared",
        language: "typescript",
        code: declarations.join("\n\n"),
      },
    ],
  });
}
const value = {
  slug: "api-reference",
  title: "Public API reference",
  description: `${members.length} named exports from the nayan-ui compatibility entry, with links to game engine guides and focused module references.`,
  sections,
};
let text = JSON.stringify(value, null, 2);
for (const section of sections)
  for (const example of section.examples ?? [])
    text = text.replace(
      JSON.stringify(example.code),
      "`" +
        example.code.replaceAll("\\", "\\\\").replaceAll("`", "\\`").replaceAll("${", "\\${") +
        "`",
    );
for (const [file, contents] of [
  ["api-reference.ts", `// Generated by scripts/sync-nayan-reference.mjs from the audited engine declarations.\nimport type { EngineGuide } from "./types";\nexport const apiReferenceGuide: EngineGuide = ${text};\n`],
  ["api-inventory.json", JSON.stringify(members, null, 2) + "\n"],
]) {
  const path = resolve(website, "src/services/ui", file);
  if (check) {
    if (readFileSync(path, "utf8") !== contents) throw new Error(`${file} is out of date. Run reference:generate.`);
  } else {
    writeFileSync(path, contents);
  }
}
console.log(`${check ? "Checked" : "Documented"} ${members.length} exports from ${groups.size} engine modules.`);
