// Regenerates cpp/generated/NayanEngineSpecJSI.h from the TurboModule spec (src/native).
// iOS generates this header itself during `pod install`; Android builds the module as a pure C++
// dependency (no Gradle project, so no codegen step), so the library ships the generated header.
// Run after changing src/native/*:  bun run codegen
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const pkg = require(path.join(root, "package.json"));
const reactNative = path.dirname(require.resolve("react-native/package.json", { paths: [root] }));
const codegen = path.dirname(require.resolve("@react-native/codegen/package.json", { paths: [reactNative] }));
const { combineSchemasInFileList } = require(path.join(codegen, "lib/cli/combine/combine-js-to-schema.js"));
const RNCodegen = require(path.join(codegen, "lib/generators/RNCodegen.js"));

const { name, jsSrcsDir } = pkg.codegenConfig;
const schema = combineSchemasInFileList([path.join(root, jsSrcsDir)], "android", undefined, name);
const outputDirectory = path.join(root, "cpp", "generated");
fs.mkdirSync(outputDirectory, { recursive: true });

RNCodegen.generate(
  { libraryName: name, schema, outputDirectory, packageName: "", assumeNonnull: false },
  { generators: ["modulesCxx"] },
);
console.log(`generated ${path.relative(root, path.join(outputDirectory, `${name}JSI.h`))}`);
