// Refresh the API snapshot from a built engine checkout; never import the engine at website runtime.
// Usage: bun scripts/sync-engine-reference.mjs /absolute/path/to/playtura/packages/engine
import ts from "typescript";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const engine = process.argv[2];
if (!engine)
  throw new Error("Pass the engine package directory after building its browser declarations.");
const website = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entry = resolve(engine, "src/index.ts");
const root = resolve(engine, "lib/web/types/src");
const source = ts.createSourceFile(
  entry,
  readFileSync(entry, "utf8"),
  ts.ScriptTarget.Latest,
  true,
);
const targets = {
  "world/World": "world-entities",
  "world/Scoreboard": "scoreboard-timers",
  "world/types": "world-entities",
  "world/TransformBatch": "cache-performance",
  "render/GameView": "game-view",
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
  "assets/font": "text-fonts",
  "media/audio": "audio-haptics",
  "media/haptics": "audio-haptics",
  "input/Joystick": "input-picking",
  types: "render-source",
};
const groups = new Map();
for (const statement of source.statements) {
  if (
    !ts.isExportDeclaration(statement) ||
    !statement.moduleSpecifier ||
    !statement.exportClause ||
    !ts.isNamedExports(statement.exportClause)
  )
    continue;
  const module = statement.moduleSpecifier.text.replace(/^\.\//, "");
  if (!targets[module]) throw new Error(`Assign a detailed guide to new engine module ${module}`);
  const group = groups.get(module) ?? [];
  for (const element of statement.exportClause.elements)
    group.push({
      name: element.name.text,
      local: element.propertyName?.text ?? element.name.text,
      typeOnly: statement.isTypeOnly || element.isTypeOnly,
    });
  groups.set(module, group);
}
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const members = [];
const sections = [
  {
    id: "reading-the-reference",
    title: "Reading the reference",
    paragraphs: [
      "Every public export is listed below. Signatures come from built declarations. Gameplay APIs are shared; host styles and asset sources follow the platform guides.",
      "Use declarations to look up types. Use the runnable examples and linked guides for setup, behavior and cleanup.",
    ],
  },
];
for (const [module, symbols] of groups) {
  const path = resolve(root, `${module}.d.ts`);
  if (!existsSync(path))
    throw new Error(`Build the engine browser declarations first; missing ${path}`);
  const file = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
  const declarations = [];
  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) continue;
    const name = statement.name?.text;
    const vars = ts.isVariableStatement(statement)
      ? statement.declarationList.declarations.map((d) => d.name.getText(file))
      : [];
    const publicItem = symbols.some(
      (symbol) => symbol.local === name || vars.includes(symbol.local),
    );
    // Local Props/Node support types make the exported function signatures readable.
    const supportType =
      (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) &&
      !statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!publicItem && !supportType) continue;
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
    declarations.push(printer.printNode(ts.EmitHint.Unspecified, node, file));
  }
  for (const symbol of symbols)
    members.push({ name: symbol.name, module, typeOnly: symbol.typeOnly, guide: targets[module] });
  sections.push({
    id: module.replaceAll("/", "-"),
    title: module,
    paragraphs: [`Usage and examples: /engine/${targets[module]}.`],
    table: {
      headers: ["Export", "Kind", "Guide"],
      rows: symbols.map((s) => [
        s.name,
        s.typeOnly ? "TypeScript type" : "Runtime API",
        `/engine/${targets[module]}`,
      ]),
    },
    examples: [
      {
        title: `${module} declarations`,
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
  description: `${members.length} named public exports, including classes, helpers, component contracts and TypeScript data structures, audited against the shared engine entry point.`,
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
writeFileSync(
  resolve(website, "src/services/engine/api-reference.ts"),
  `// Generated by scripts/sync-engine-reference.mjs from the audited engine declarations.\nimport type { EngineGuide } from "./types";\nexport const apiReferenceGuide: EngineGuide = ${text};\n`,
);
writeFileSync(
  resolve(website, "src/services/engine/api-inventory.json"),
  JSON.stringify(members, null, 2) + "\n",
);
console.log(`Documented ${members.length} exports from ${groups.size} engine modules.`);
